'use client'

import { useState, useRef } from 'react'

interface FileUploaderProps {
  onFilesChange: (files: File[]) => void
  maxFiles?: number
}

export default function FileUploader({ onFilesChange, maxFiles = 10 }: FileUploaderProps) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const newFiles = [...files, ...selectedFiles].slice(0, maxFiles)
    setFiles(newFiles)
    onFilesChange(newFiles)

    // Generate previews
    newFiles.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreviews((prev) => ({
            ...prev,
            [file.name]: reader.result as string,
          }))
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    onFilesChange(newFiles)
    const fileName = files[index].name
    setPreviews((prev) => {
      const newPreviews = { ...prev }
      delete newPreviews[fileName]
      return newPreviews
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="form-control space-y-4">
      <label className="label">
        <span className="label-text font-semibold">Fichiers joints (images, PDF, audio, vidéo)</span>
      </label>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,application/pdf,audio/*,video/*,.doc,.docx,.txt"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="btn btn-outline btn-primary w-full"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Ajouter des fichiers ({files.length}/{maxFiles})
      </button>

      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {files.map((file, index) => (
            <div key={index} className="card bg-base-300 shadow-md">
              <figure className="relative">
                {previews[file.name] ? (
                  <img
                    src={previews[file.name]}
                    alt={file.name}
                    className="w-full h-32 object-cover"
                  />
                ) : (
                  <div className="w-full h-32 bg-base-200 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-1">📄</div>
                      <div className="text-xs text-base-content/70 truncate px-2">{file.name}</div>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="btn btn-sm btn-circle btn-error absolute top-2 right-2"
                >
                  ×
                </button>
              </figure>
              <div className="card-body p-2">
                <p className="text-xs text-base-content/70">{formatFileSize(file.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
