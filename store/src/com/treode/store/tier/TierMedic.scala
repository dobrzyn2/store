package com.treode.store.tier

import com.treode.async.Scheduler
import com.treode.disk.{Launch, Recovery, TypeId}
import com.treode.store.{Bytes, StoreConfig}

trait TierMedic {

  def put (gen: Long, key: Bytes, value: Bytes)

  def delete (gen: Long, key: Bytes)

  def checkpoint (meta: TierTable.Meta)

  def close () (implicit launcher: Launch): TierTable
}

object TierMedic {

  def apply [K, V] (desc: TierDescriptor [K, V]) (
      implicit scheduler: Scheduler, recovery: Recovery, config: StoreConfig): TierMedic =
    new SynthMedic (desc)
}