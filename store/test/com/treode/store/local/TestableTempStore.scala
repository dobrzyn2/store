package com.treode.store.local

import com.treode.cluster.concurrent.Callback
import com.treode.pickle.Picklers
import com.treode.store._
import com.treode.store.lock.LockSpace
import org.scalatest.Assertions

private class TestableTempStore extends LocalStore with Assertions {

  private val Xid = TxId (Bytes (Picklers.int, 1))

  protected val space = new LockSpace (4)

  private var _tables = Map.empty [TableId, TestableTempTable]

  def table (id: TableId): TestableTempTable = synchronized {
    _tables.get (id) match {
      case Some (t) =>
        t
      case None =>
        val t = new TestableTempTable
        _tables += (id -> t)
        t
    }}

  def readAndExpect (rt: Int, ops: ReadOp*) (expected: Value*) {
    val batch = ReadBatch (rt, ops)
    super.read (batch, new StubReadCallback {
      override def apply (actual: Seq [Value]) = expectResult (expected) (actual)
    })
  }

  def writeExpectApply (ct: Int, ops: WriteOp*) (cb: Transaction => Any) = {
    val batch = WriteBatch (Xid, ct, ct, ops)
    super.write (batch, new StubWriteCallback {
      override def apply (tx: Transaction) = cb (tx)
    })
  }

  def writeExpectAdvance (ct: Int, ops: WriteOp*) = {
    val batch = WriteBatch (Xid, ct, ct, ops)
    super.write (batch, new StubWriteCallback {
      override def advance() = ()
    })
  }

  def writeExpectConflicts (ct: Int, ops: WriteOp*) (expected: Int*) = {
    val batch = WriteBatch (Xid, ct, ct, ops)
    super.write (batch, new StubWriteCallback {
      override def conflicts (actual: Set [Int]) = expectResult (expected.toSet) (actual)
    })
  }}