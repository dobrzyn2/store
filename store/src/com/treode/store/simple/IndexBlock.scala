package com.treode.store.simple

import java.util.{Arrays, ArrayList}
import com.treode.pickle.{Pickler, Picklers, PickleContext, UnpickleContext}
import com.treode.store.{Bytes, TxClock}
import com.treode.store.disk.{AbstractBlockPickler, Block}

private class IndexBlock (val entries: Array [IndexEntry]) extends Block {

  def get (i: Int): IndexEntry =
    entries (i)

  def find (key: Bytes): Int = {
    val i = Arrays.binarySearch (entries, IndexEntry (key, 0), IndexEntry)
    if (i < 0) -i-1 else i
  }

  def size: Int = entries.size

  def isEmpty: Boolean = entries.size == 0

  def last: IndexEntry = entries (entries.size - 1)
}

private object IndexBlock {

  val empty = new IndexBlock (new Array (0))

  def apply (entries: Array [IndexEntry]): IndexBlock =
    new IndexBlock (entries)

  def apply (entries: ArrayList [IndexEntry]): IndexBlock =
    new IndexBlock (entries.toArray (empty.entries))

  private val _pickle: Pickler [IndexBlock] =
    new AbstractBlockPickler [IndexBlock, IndexEntry] {

      private [this] val blockPos = Picklers.ulong

      protected def writeEntry (entry: IndexEntry, ctx: PickleContext) {
        writeKey (entry.key, ctx)
        blockPos.p (entry.pos, ctx)
      }

      protected def readEntry (ctx: UnpickleContext): IndexEntry = {
        val key = readKey (ctx)
        val pos = blockPos.u (ctx)
        IndexEntry (key, pos)
      }

      protected def writeEntry (prev: IndexEntry, entry: IndexEntry, ctx: PickleContext) {
        writeKey (prev.key, entry.key, ctx)
        blockPos.p (entry.pos, ctx)
      }

      protected def readEntry (prev: IndexEntry, ctx: UnpickleContext): IndexEntry = {
        val key = readKey (prev.key, ctx)
        val pos = blockPos.u (ctx)
        IndexEntry (key, pos)
      }

      def p (block: IndexBlock, ctx: PickleContext): Unit =
        _p (block.entries, ctx)

      def u (ctx: UnpickleContext): IndexBlock =
        new IndexBlock (_u (ctx))
  }

  val pickle = {
    import Picklers._
    tagged [IndexBlock] (0x1 -> _pickle)
  }}
