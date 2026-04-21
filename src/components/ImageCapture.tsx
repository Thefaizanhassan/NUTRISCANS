import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { Camera, Image as ImageIcon, X, Upload } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageCaptureProps {
  onImageSelect: (image: string | null, file: File | null) => void
  selectedImage: string | null
}

export function ImageCapture({ onImageSelect, selectedImage }: ImageCaptureProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const cameraInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = (e) => {
      onImageSelect(e.target?.result as string, file)
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  return (
    <div 
      className={cn(
        "relative h-[50vh] md:h-[60vh] w-full bg-[#2C2C2A] overflow-hidden transition-all duration-300",
        isDragging && "bg-[#3D3D3A]"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <AnimatePresence mode="wait">
        {!selectedImage ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full w-full flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="absolute inset-8 border-2 border-dashed border-white/10 rounded-3xl pointer-events-none" />
            
            <div className="space-y-6 z-10">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                <Camera className="w-10 h-10 text-white/40" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-white font-bold text-lg">Tap to capture or upload</h3>
                <p className="text-white/40 text-sm max-w-[240px] mx-auto">
                  Take a clear photo of your meal for the most accurate analysis
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  aria-label="Take a photo with camera"
                  className="flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-2xl font-bold text-sm hover:bg-white/90 transition-all active:scale-95"
                >
                  <Camera size={18} />
                  Take Photo
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Upload an image from gallery"
                  className="flex items-center justify-center gap-2 bg-white/10 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-white/20 transition-all border border-white/10 active:scale-95"
                >
                  <ImageIcon size={18} />
                  Upload Image
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative h-full w-full"
          >
            <img 
              src={selectedImage} 
              alt="Preview" 
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/20" />
            
            {/* Viewfinder Corners */}
            <div className="absolute inset-12 pointer-events-none">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white/60 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white/60 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white/60 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white/60 rounded-br-lg" />
            </div>

            <button
              onClick={() => onImageSelect(null, null)}
              aria-label="Remove selected image"
              className="absolute top-6 right-6 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-all"
            >
              <X size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  )
}
