import { useState, useRef, useEffect } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

import dryAudio from '@/assets/dry.m4a'
import wetAudio from '@/assets/wet.m4a'

const AudioComparePlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isWet, setIsWet] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const dryAudioRef = useRef<HTMLAudioElement>(null)
  const wetAudioRef = useRef<HTMLAudioElement>(null)
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    const dryAudio = dryAudioRef.current
    const wetAudio = wetAudioRef.current

    if (!dryAudio || !wetAudio) return

    dryAudio.volume = 1
    wetAudio.volume = 0

    const handleLoadedData = () => {
      if (dryAudio.readyState >= 2 && wetAudio.readyState >= 2) {
        setDuration(dryAudio.duration)
        setIsLoading(false)
      }
    }

    dryAudio.addEventListener('loadeddata', handleLoadedData)
    wetAudio.addEventListener('loadeddata', handleLoadedData)

    dryAudio.load()
    wetAudio.load()

    return () => {
      dryAudio.removeEventListener('loadeddata', handleLoadedData)
      wetAudio.removeEventListener('loadeddata', handleLoadedData)
    }
  }, [])

  useEffect(() => {
    const updateTime = () => {
      const active = isWet ? wetAudioRef.current : dryAudioRef.current
      if (active && isPlaying) {
        setCurrentTime(active.currentTime)
        animationFrameRef.current = requestAnimationFrame(updateTime)
      }
    }

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateTime)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, isWet])

  useEffect(() => {
    const dry = dryAudioRef.current
    const wet = wetAudioRef.current
    if (!dry || !wet) return

    if (isWet) wet.currentTime = dry.currentTime
    else dry.currentTime = wet.currentTime

    dry.volume = isWet ? 0 : 1
    wet.volume = isWet ? 1 : 0

    if (isPlaying) {
      if (isWet) {
        wet.play()
        dry.pause()
      } else {
        dry.play()
        wet.pause()
      }
    }
  }, [isWet, isPlaying])

  const togglePlay = () => {
    const active = isWet ? wetAudioRef.current : dryAudioRef.current
    if (!active) return

    if (isPlaying) active.pause()
    else active.play()

    setIsPlaying(!isPlaying)
  }

  const handleReset = () => {
    const dry = dryAudioRef.current
    const wet = wetAudioRef.current
    if (dry && wet) {
      dry.currentTime = 0
      wet.currentTime = 0
      setCurrentTime(0)

      if (isPlaying) {
        const active = isWet ? wet : dry
        active.play()
      }
    }
  }

  const handleSeek = (value: number[]) => {
    const newTime = value[0]
    const dry = dryAudioRef.current
    const wet = wetAudioRef.current
    if (dry && wet) {
      dry.currentTime = newTime
      wet.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const formatTime = (time: number) => {
    const m = Math.floor(time / 60)
    const s = Math.floor(time % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl border border-gray-200">
      <div className="space-y-6">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">DryWet Audio Comparison Player</h2>
          <p className="text-gray-500">Compare dry and processed audio in real-time</p>
        </div>

        {/* Hidden audio */}
        <audio ref={dryAudioRef} preload="auto" src={dryAudio} />
        <audio ref={wetAudioRef} preload="auto" src={wetAudio} />

        {/* Dry/Wet Toggle */}
        <div className="flex items-center justify-center gap-4 p-4 bg-gray-100 rounded-xl border border-gray-300">
          <Label
            htmlFor="wet-mode"
            className={`text-lg font-semibold transition-colors cursor-pointer ${
              !isWet ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            Dry
          </Label>

          <Switch
            id="wet-mode"
            checked={isWet}
            onCheckedChange={setIsWet}
            disabled={isLoading}
            className="data-[state=checked]:bg-green-500 cursor-pointer"
          />

          <Label
            htmlFor="wet-mode"
            className={`text-lg font-semibold transition-colors cursor-pointer ${
              isWet ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            Wet
          </Label>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            disabled={isLoading}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 pr-11">
          <button
            onClick={handleReset}
            disabled={isLoading}
            className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-5 h-5 text-gray-700" />
          </button>

          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="p-6 rounded-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 disabled:opacity-50 transition-all transform hover:scale-105 shadow-lg cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white" />
            ) : (
              <Play className="w-8 h-8 text-white" />
            )}
          </button>
        </div>

        {/* Status Indicator */}
        <div className="text-center">
          {isLoading ? (
            <p className="text-gray-500 text-sm">Loading audio files...</p>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`}
              />
              <p className="text-gray-600 text-sm">
                {isPlaying ? 'Playing' : 'Paused'} · {isWet ? 'Wet (Processed)' : 'Dry (Original)'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AudioComparePlayer
