'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, MapPin, RefreshCw, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export interface CaptureData {
  photo: string       // base64 data URL (data:image/jpeg;base64,...)
  latitude: string    // e.g. "13.7563"
  longitude: string   // e.g. "100.5018"
}

interface CameraCaptureProps {
  onCapture: (data: CaptureData) => void
  onCancel: () => void
  loading?: boolean
}

type GpsStatus = 'loading' | 'success' | 'error' | 'denied'

export function CameraCapture({ onCapture, onCancel, loading }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mountedRef = useRef(true)

  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)

  const [gpsStatus, setGpsStatus] = useState<GpsStatus>(() =>
    typeof navigator !== 'undefined' && navigator.geolocation ? 'loading' : 'error'
  )
  const [latitude, setLatitude] = useState<string>('')
  const [longitude, setLongitude] = useState<string>('')

  // Start camera on mount
  useEffect(() => {
    mountedRef.current = true

    let cancelled = false

    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        })

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          if (mountedRef.current) {
            setCameraReady(true)
          }
        }
      } catch (err: unknown) {
        if (!mountedRef.current) return

        if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
          setCameraError('Akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser Anda.')
        } else if (err instanceof DOMException && err.name === 'NotFoundError') {
          setCameraError('Kamera tidak ditemukan pada perangkat ini.')
        } else {
          setCameraError('Gagal mengakses kamera. Pastikan browser memiliki izin untuk menggunakan kamera.')
        }
      }
    }

    initCamera()

    return () => {
      cancelled = true
      mountedRef.current = false
      // Cleanup: stop all camera tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [])

  // Capture GPS on mount
  useEffect(() => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (mountedRef.current) {
          setLatitude(position.coords.latitude.toFixed(4))
          setLongitude(position.coords.longitude.toFixed(4))
          setGpsStatus('success')
        }
      },
      (err) => {
        if (!mountedRef.current) return
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus('denied')
        } else {
          setGpsStatus('error')
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }, [])

  const handleTakePhoto = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Mirror the image horizontally for front-facing camera
    ctx.save()
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    ctx.restore()

    const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
    setCapturedPhoto(dataUrl)
  }, [])

  const handleRetake = useCallback(() => {
    setCapturedPhoto(null)
  }, [])

  const handleConfirm = useCallback(() => {
    if (!capturedPhoto) return

    onCapture({
      photo: capturedPhoto,
      latitude,
      longitude,
    })
  }, [capturedPhoto, latitude, longitude, onCapture])

  // GPS badge content
  const renderGpsBadge = () => {
    switch (gpsStatus) {
      case 'loading':
        return (
          <Badge variant="secondary" className="gap-1 text-xs">
            <MapPin className="size-3 animate-pulse" />
            Mendeteksi lokasi...
          </Badge>
        )
      case 'success':
        return (
          <Badge variant="default" className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700">
            <MapPin className="size-3" />
            {latitude}, {longitude}
          </Badge>
        )
      case 'denied':
        return (
          <Badge variant="destructive" className="gap-1 text-xs">
            <MapPin className="size-3" />
            Lokasi ditolak - absen tetap diperbolehkan
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1 text-xs">
            <MapPin className="size-3" />
            Gagal mendapatkan lokasi
          </Badge>
        )
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="flex flex-col items-center gap-4 p-4 pt-6">
        {/* Camera view / Captured photo preview */}
        <div className="relative w-full max-w-sm aspect-[4/3] rounded-lg overflow-hidden bg-muted border">
          {cameraError ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 p-4 text-center">
              <Camera className="size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{cameraError}</p>
            </div>
          ) : capturedPhoto ? (
            <img
              src={capturedPhoto}
              alt="Foto yang diambil"
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
          )}

          {/* Hidden canvas for capturing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* GPS badge */}
        <div className="w-full flex justify-center">
          {renderGpsBadge()}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col w-full gap-2">
          {!cameraError && (
            <div className="flex gap-2">
              {capturedPhoto ? (
                <>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={handleRetake}
                    disabled={loading}
                  >
                    <RefreshCw className="size-4" />
                    Ambil Ulang
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    onClick={handleConfirm}
                    disabled={loading || gpsStatus === 'loading'}
                  >
                    {loading ? (
                      <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}
                    Konfirmasi
                  </Button>
                </>
              ) : (
                <Button
                  className="flex-1 gap-2"
                  onClick={handleTakePhoto}
                  disabled={!cameraReady}
                >
                  <Camera className="size-4" />
                  Ambil Foto
                </Button>
              )}
            </div>
          )}

          <Button
            variant="ghost"
            className="w-full gap-2 text-muted-foreground"
            onClick={onCancel}
            disabled={loading}
          >
            <X className="size-4" />
            Batal
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
