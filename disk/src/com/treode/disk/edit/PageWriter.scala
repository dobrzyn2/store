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

private class PageWriter(dsp: PageDispatcher,val file: File)
 {
  val bits = 10
  val buffer = PagedBuffer (bits)
  var pos : Long = buffer.writePos
  val dispatcher = dsp
  

  listen() run (ignore)

  def listen(): Async[Unit] =
    for {
      (_, strings) <- dispatcher.receive()    //returns (unrolledBuffer,cb)
      _ <- write(strings)
    } yield {
      listen() run (ignore)
    }

  /**
   * Write `data` into the file asynchronously, using a write buffer. Returns
   * the position of the writer and length written, if successful.
   */
  def write (data: UnrolledBuffer [(String, Callback[(Long, Long)])]) : Async [(Long, Long)] = {
    println("start write>>")
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
    println("write pos after writing " + buffer.writePos)
    println("writePos Array" + writePositions.mkString(" "))
    for(a <- 1 until writePositions.length)
    {
      print(" > " + writePositions(a))
    }
    println("-*-*")
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
