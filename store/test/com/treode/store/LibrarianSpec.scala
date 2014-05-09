package com.treode.store

import scala.util.Random

import com.treode.async.Async
import com.treode.async.stubs.StubScheduler
import com.treode.async.io.stubs.StubFile
import com.treode.async.stubs.{AsyncCaptor, AsyncChecks, StubScheduler}
import com.treode.async.stubs.implicits._
import com.treode.cluster.{Cluster, HostId}
import com.treode.cluster.stubs.{StubActiveHost, StubNetwork}
import com.treode.disk.stubs.{StubDisks, StubDiskDrive}
import com.treode.store.catalog.Catalogs
import org.scalatest.FlatSpec

import Async.when
import StoreTestTools._

class LibrarianSpec extends FlatSpec with AsyncChecks {

  private class StubLibrarianHost (id: HostId) (implicit kit: StoreTestKit)
  extends StubActiveHost (id) (kit.random, kit.scheduler, kit.network) {
    import kit._

    implicit val cluster: Cluster = this
    implicit val library = new Library

    implicit val storeConfig = TestStoreConfig()
    implicit val recovery = StubDisks.recover()
    implicit val _catalogs = Catalogs.recover()

    val diskDrive = new StubDiskDrive

    val _launch =
      for {
        launch <- recovery.attach (diskDrive)
        catalogs <- _catalogs.launch (launch)
      } yield {
        launch.launch()
        (launch.disks, catalogs)
      }

    val captor = _launch.capture()
    scheduler.runTasks()
    while (!captor.wasInvoked)
      Thread.sleep (10)
    implicit val (disks, catalogs) = captor.passed

    val rebalancer = AsyncCaptor [Unit]

    def rebalance (atlas: Atlas): Async [Unit] = {
      val active = atlas.cohorts (0) contains localId
      val moving = atlas.cohorts exists (_.moving)
      when (active && moving) (rebalancer.start())
    }

    val librarian = new Librarian (rebalance _)

    def issue (cohorts: Cohort*) {
      val version = library.atlas.version + 1
      val atlas = Atlas (cohorts.toArray, version)
      library.atlas = atlas
      library.residents = atlas.residents (localId)
      catalogs.issue (Atlas.catalog) (version, atlas) .pass
    }

    def expectAtlas (atlas: Atlas) {
      assertResult (atlas) (library.atlas)
      assertResult (librarian.issued) (atlas.version)
      assert (librarian.receipts forall (_._2 == atlas.version))
    }}

  def expectAtlas (version: Int, cohorts: Cohort*) (hosts: Seq [StubLibrarianHost]) {
    val atlas = Atlas (cohorts.toArray, version)
    for (host <- hosts)
      host.expectAtlas (atlas)
  }

  "It" should "work" in {

    implicit val kit = StoreTestKit()

    val hs = kit.install (10, new StubLibrarianHost (_))
    val Seq (h0, h1, h2, h3) = hs take 4

    for (h1 <- hs; h2 <- hs)
      h1.hail (h2.localId, null)
    h0.issue (issuing (h0, h1, h2) (h0, h1, h3))
    kit.runTasks (count = 2000, timers = true)
    expectAtlas (2, moving (h0, h1, h2) (h0, h1, h3)) (hs)
    h0.rebalancer.pass()
    kit.runTasks (count = 1000, timers = true)
    expectAtlas (2, moving (h0, h1, h2) (h0, h1, h3)) (hs)
    h1.rebalancer.pass()
    kit.runTasks (count = 1000, timers = true)
    expectAtlas (2, moving (h0, h1, h2) (h0, h1, h3)) (hs)
    h2.rebalancer.pass()
    kit.runTasks (count = 2000, timers = true)
    expectAtlas (3, settled (h0, h1, h3)) (hs)
  }}
