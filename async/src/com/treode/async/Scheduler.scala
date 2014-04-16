package com.treode.async

import java.util.concurrent.{Executor, TimeUnit, ScheduledExecutorService}
import scala.runtime.NonLocalReturnControl
import scala.util.{Failure, Success, Try}

import Scheduler.toRunnable

trait Scheduler extends Executor {

  def execute (task: Runnable)

  def delay (millis: Long, task: Runnable)

  def at (millis: Long, task: Runnable)

  def execute (task: => Any): Unit =
    execute (toRunnable (task))

  def execute [A] (f: A => Any, v: A): Unit =
    execute (toRunnable (f, v))

  def execute [A] (cb: Callback [A], v: Try [A]): Unit =
    execute (toRunnable (cb, v))

  def delay (millis: Long) (task: => Any): Unit =
    delay (millis, toRunnable (task))

  def at (millis: Long) (task: => Any): Unit =
    at (millis, toRunnable (task))

  def pass [A] (cb: Callback [A], v: A): Unit =
    execute (cb, Success (v))

  def fail [A] (cb: Callback [A], t: Throwable): Unit =
    execute (cb, Failure (t))

  def whilst [A] (p: => Boolean) (f: => Async [Unit]): Async [Unit] =
    new RichExecutor (this) .whilst (p) (f)
}

object Scheduler {

  def apply (executor: ScheduledExecutorService): Scheduler =
    new ExecutorAdaptor (executor)

  def toRunnable (task: => Any): Runnable =
    new Runnable {
      def run() =
        try {
          task
        } catch {
          case t: NonLocalReturnControl [_] => ()
          case t: CallbackException => throw t.getCause
        }}

  def toRunnable [A] (f: A => Any, v: A): Runnable =
    new Runnable {
      def run() =
        try {
          f (v)
        } catch {
          case t: NonLocalReturnControl [_] => ()
          case t: CallbackException => throw t.getCause
        }}

  def toRunnable [A] (cb: Callback [A], v: Try [A]): Runnable =
    new Runnable {
      def run() =
        try {
          cb (v)
        } catch {
          case t: NonLocalReturnControl [_] => ()
          case t: CallbackException => throw t.getCause
        }}}
