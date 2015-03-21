/* Copyright 2014 Treode, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.treode.disk.edit
import com.treode.async.{Async, Callback, Scheduler}, Async.supply, Callback.ignore
import com.treode.async.io.File
import com.treode.async.Async
import com.treode.buffer.PagedBuffer
import scala.collection.mutable.UnrolledBuffer
import com.treode.async.implicits._
import com.treode.disk.Position
import com.treode.async.{Async, Callback, Scheduler}, Async.async
import com.treode.disk.PickledPage

private class PageWriter(dsp: PageDispatcher,val file: File)
 {
  val bits = 10
  val buffer = PagedBuffer (bits)
  var pos : Long = buffer.writePos
  val dispatcher = dsp
  

  listen() run (ignore)

  def listen(): Async[Unit] =
    for {
      (_, dataBuffers) <- dispatcher.receive()    //returns (unrolledBuffer,cb)
      _ <- write(dataBuffers)
    } yield {
      listen() run (ignore)
    }


// we ignore the type param of PageDescriptor for now and only focus on one disk
   def write(data: UnrolledBuffer[PickledPage]): Async [Unit] = {
    var writePositions : Array[Position] = new Array[Position](0);
    var beforeAnyWrites = pos
    var i = 0; 
    for (s <- data) {
      val beforeEachWritePos = buffer.writePos
      s.write(buffer)
      val writeLen : Long = (buffer.writePos - beforeEachWritePos).toLong
      writePositions :+= (Position(0,pos.toLong, writeLen.toInt))//only focus on one disk for now
      pos += writeLen
      i += 1
    }
    for {
      _ <- file.flush (buffer, beforeAnyWrites)
    } yield {
      buffer.clear ()
      var q = 0
      for (s <- data){
        s.cb.pass(writePositions(q))
        q += 1
      }
    }
  }

  /**
   * Write `data` into the file asynchronously, using a write buffer. Returns
   * the position where the batch was written and length of the batch written, if successful.
   * Returns each individual string in the batch's position & length to the relevant callback
   */
  def writeString (data: UnrolledBuffer [(String, Callback[(Long, Long)])]) : Async [(Long, Long)] = {
    var writePositions : Array[(Long,Long)] = new Array[(Long,Long)](0);
    var beforeAnyWrites = pos
    var i = 0; 
    for (s <- data) {
      val beforeEachWritePos = buffer.writePos
      buffer.writeString (s._1)
      val writeLen : Long = (buffer.writePos - beforeEachWritePos).toLong
      writePositions :+= ((pos, writeLen ))
      pos += writeLen
      i += 1
    }
    for {
      _ <- file.flush (buffer, beforeAnyWrites)
    } yield {
      buffer.clear ()
      var q = 0
      for (s <- data){
        s._2.pass(writePositions(q))
        q += 1
      }
      (beforeAnyWrites, buffer.writePos - beforeAnyWrites)
    }
  }

}
