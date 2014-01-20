package com.treode.async.io

import java.nio.ByteBuffer
import java.nio.channels.{AsynchronousChannelGroup, AsynchronousSocketChannel}
import java.net.SocketAddress
import java.util.concurrent.{Executor, TimeUnit}

import com.treode.async.{Callback, toRunnable}
import com.treode.buffer.PagedBuffer

import TimeUnit.MILLISECONDS

/** A socket that has useful behavior (flush/fill) and that can be mocked. */
class Socket (socket: AsynchronousSocketChannel, exec: Executor) {

  def connect (addr: SocketAddress, cb: Callback [Unit]): Unit =
    try {
      socket.connect (addr, cb, Callback.UnitHandler)
    } catch {
      case t: Throwable => cb.fail (t)
    }

  def close(): Unit =
    socket.close()

  private class Filler (input: PagedBuffer, length: Int, cb: Callback [Unit])
  extends Callback [Long] {

    def fill() {
      if (length <= input.readableBytes)
        exec.execute (toRunnable (cb, ()))
      else {
        val bytebufs = input.buffers (input.writePos, input.writeableBytes)
        socket.read (bytebufs, 0, bytebufs.length, -1, MILLISECONDS, this, Callback.LongHandler)
      }}

    def pass (result: Long) {
      require (result <= Int.MaxValue)
      if (result < 0) {
        cb.fail (new Exception ("End of file reached."))
      } else {
        input.writePos = input.writePos + result.toInt
        fill()
      }}

    def fail (t: Throwable) = cb.fail (t)
  }

  def fill (input: PagedBuffer, length: Int, cb: Callback [Unit]): Unit =
    try {
      if (length <= input.readableBytes) {
        exec.execute (toRunnable (cb, ()))
      } else {
        input.capacity (input.readPos + length)
        new Filler (input, length, cb) .fill()
      }
    } catch {
      case t: Throwable => cb.fail (t)
    }

  private class Flusher (output: PagedBuffer, cb: Callback [Unit])
  extends Callback [Long] {

    def flush() {
      if (output.readableBytes == 0) {
        //buffer.release()
        exec.execute (toRunnable (cb, ()))
      } else {
        val bytebufs = output.buffers (output.readPos, output.readableBytes)
        socket.write (bytebufs, 0, bytebufs.length, -1, MILLISECONDS, this, Callback.LongHandler)
      }}

    def pass (result: Long) {
      require (result <= Int.MaxValue)
      if (result < 0) {
        cb.fail (new Exception ("File write failed."))
      } else {
        output.readPos = output.readPos + result.toInt
        flush()
      }}

    def fail (t: Throwable) = cb.fail (t)
  }


  def flush (output: PagedBuffer, cb: Callback [Unit]): Unit =
    try {
      if (output.readableBytes == 0)
        exec.execute (toRunnable (cb, ()))
      else
        new Flusher (output, cb) .flush()
    } catch {
      case t: Throwable => cb.fail (t)
    }
}

object Socket {

  def open (group: AsynchronousChannelGroup, exec: Executor): Socket =
    new Socket (AsynchronousSocketChannel.open (group), exec)
}
