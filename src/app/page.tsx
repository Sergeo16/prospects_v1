'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import FileUploader from '@/components/FileUploader'

const LANGUAGES = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'ar', label: 'العربية' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
]

export default function HomePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    companyName: '',
    problemDescription: '',
    currentSituation: '',
    desiredSolution: '',
    knownAppReferences: '',
    budgetMin: '',
    budgetMax: '',
    deadlinePreference: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    language: 'fr',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.clientName.trim()) {
      toast.error('Veuillez saisir votre nom complet')
      return
    }

    if (!formData.problemDescription.trim()) {
      toast.error('Veuillez décrire le problème à résoudre')
      return
    }

    if (!formData.currentSituation.trim()) {
      toast.error('Veuillez décrire la situation actuelle')
      return
    }

    if (!formData.desiredSolution.trim()) {
      toast.error('Veuillez décrire la solution souhaitée')
      return
    }

    // Validation budget
    if (formData.budgetMin && formData.budgetMax) {
      const min = parseFloat(formData.budgetMin)
      const max = parseFloat(formData.budgetMax)
      if (min > max) {
        toast.error('Le budget minimum ne peut pas être supérieur au budget maximum')
        return
      }
    }

    setIsSubmitting(true)

    try {
      const submitData = new FormData()
      submitData.append('clientName', formData.clientName)
      submitData.append('clientEmail', formData.clientEmail)
      submitData.append('clientPhone', formData.clientPhone)
      submitData.append('companyName', formData.companyName)
      submitData.append('problemDescription', formData.problemDescription)
      submitData.append('currentSituation', formData.currentSituation)
      submitData.append('desiredSolution', formData.desiredSolution)
      submitData.append('knownAppReferences', formData.knownAppReferences)
      submitData.append('budgetMin', formData.budgetMin || '')
      submitData.append('budgetMax', formData.budgetMax || '')
      submitData.append('deadlinePreference', formData.deadlinePreference)
      submitData.append('priority', formData.priority)
      submitData.append('language', formData.language)

      files.forEach((file) => {
        submitData.append('files', file)
      })

      const response = await fetch('/api/needs', {
        method: 'POST',
        body: submitData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la soumission')
      }

      const result = await response.json()
      toast.success('Votre demande a été enregistrée avec succès!')
      router.push(`/confirmation?id=${result.id}`)
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Une erreur est survenue. Veuillez réessayer.')
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      companyName: '',
      problemDescription: '',
      currentSituation: '',
      desiredSolution: '',
      knownAppReferences: '',
      budgetMin: '',
      budgetMax: '',
      deadlinePreference: '',
      priority: 'MEDIUM',
      language: 'fr',
    })
    setFiles([])
    toast.info('Formulaire réinitialisé')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0 pb-8 sm:pb-12">
      <div className="text-center mb-8 animate-fade-in">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 gradient-text">
          Décrivez votre besoin
        </h1>
        <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
          Notre IA analysera votre demande et vous proposera une solution adaptée
        </p>
      </div>

      <form 
        onSubmit={handleSubmit} 
        className="card bg-base-100 shadow-2xl transition-all duration-500 hover:shadow-3xl border border-base-300 animate-scale-in"
      >
        <div className="card-body p-6 sm:p-8 pb-10">

          {/* Informations client */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div className="form-control w-full animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <label className="label">
                <span className="label-text font-semibold">Nom complet *</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full transition-all duration-200 focus:input-primary focus:scale-[1.02]"
                placeholder="Saisissez votre nom complet"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                required
              />
            </div>

            <div className="form-control w-full animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <label className="label">
                <span className="label-text font-semibold">Email</span>
              </label>
              <input
                type="email"
                className="input input-bordered w-full transition-all duration-200 focus:input-primary focus:scale-[1.02]"
                placeholder="email@example.com"
                value={formData.clientEmail}
                onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
              />
            </div>

            <div className="form-control w-full animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <label className="label">
                <span className="label-text font-semibold">Téléphone</span>
              </label>
              <input
                type="tel"
                className="input input-bordered w-full transition-all duration-200 focus:input-primary focus:scale-[1.02]"
                placeholder="+33 6 12 34 56 78"
                value={formData.clientPhone}
                onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
              />
            </div>

            <div className="form-control w-full animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <label className="label">
                <span className="label-text font-semibold">Entreprise</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full transition-all duration-200 focus:input-primary focus:scale-[1.02]"
                placeholder="Nom de l'entreprise"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>
          </div>

          {/* Problème */}
          <div className="form-control w-full mt-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <label className="label">
              <span className="label-text font-semibold text-lg">Problème à résoudre *</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full min-h-[140px] resize-y transition-all duration-200 focus:textarea-primary focus:scale-[1.01]"
              placeholder="Décrivez le problème que vous souhaitez résoudre..."
              rows={4}
              value={formData.problemDescription}
              onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
              required
            />
            <label className="label">
              <span className="label-text-alt text-base-content/60">
                {formData.problemDescription.length} caractères
              </span>
            </label>
          </div>

          {/* Situation actuelle */}
          <div className="form-control w-full mt-6 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <label className="label">
              <span className="label-text font-semibold text-lg">Situation actuelle *</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full min-h-[140px] resize-y transition-all duration-200 focus:textarea-primary focus:scale-[1.01]"
              placeholder="Comment gérez-vous actuellement ce problème ?"
              rows={4}
              value={formData.currentSituation}
              onChange={(e) => setFormData({ ...formData, currentSituation: e.target.value })}
              required
            />
            <label className="label">
              <span className="label-text-alt text-base-content/60">
                {formData.currentSituation.length} caractères
              </span>
            </label>
          </div>

          {/* Solution souhaitée */}
          <div className="form-control w-full mt-6 animate-fade-in" style={{ animationDelay: '0.7s' }}>
            <label className="label">
              <span className="label-text font-semibold text-lg">Solution souhaitée *</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full min-h-[140px] resize-y transition-all duration-200 focus:textarea-primary focus:scale-[1.01]"
              placeholder="Quelle solution idéale imaginez-vous ?"
              rows={4}
              value={formData.desiredSolution}
              onChange={(e) => setFormData({ ...formData, desiredSolution: e.target.value })}
              required
            />
            <label className="label">
              <span className="label-text-alt text-base-content/60">
                {formData.desiredSolution.length} caractères
              </span>
            </label>
          </div>

          {/* Références */}
          <div className="form-control w-full mt-4">
            <label className="label">
              <span className="label-text">Applications similaires (références)</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Ex: Airbnb, Uber, Notion..."
              value={formData.knownAppReferences}
              onChange={(e) => setFormData({ ...formData, knownAppReferences: e.target.value })}
            />
          </div>

          {/* Budget et délai */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Budget minimum (€)</span>
              </label>
              <input
                type="number"
                className="input input-bordered w-full"
                placeholder="0"
                min="0"
                value={formData.budgetMin}
                onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                onFocus={(e) => e.target.select()}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Budget maximum (€)</span>
              </label>
              <input
                type="number"
                className="input input-bordered w-full"
                placeholder="0"
                min="0"
                value={formData.budgetMax}
                onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                onFocus={(e) => e.target.select()}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Délai souhaité</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Ex: 3 mois, ASAP..."
                value={formData.deadlinePreference}
                onChange={(e) => setFormData({ ...formData, deadlinePreference: e.target.value })}
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Priorité</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              >
                <option value="LOW">Basse</option>
                <option value="MEDIUM">Moyenne</option>
                <option value="HIGH">Haute</option>
              </select>
            </div>

            <div className="form-control w-full sm:col-span-2">
              <label className="label">
                <span className="label-text">Langue</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Honeypot field (hidden, for bot detection) */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            style={{ position: 'absolute', left: '-9999px' }}
          />

          {/* Upload fichiers */}
          <div className="mt-6 animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <FileUploader onFilesChange={setFiles} />
          </div>

          {/* Boutons */}
          <div className="form-control mt-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                className="flex-1 btn btn-outline btn-error text-base font-semibold py-3 px-6 
                          transition-all duration-300 transform hover:scale-105 hover:shadow-lg 
                          active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 btn btn-primary text-base font-semibold py-3 px-6 
                          transition-all duration-300 transform hover:scale-105 hover:shadow-lg 
                          active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                          relative overflow-hidden group"
                disabled={isSubmitting}
              >
                <span className="relative z-10">
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm mr-2"></span>
                      Envoi en cours...
                    </>
                  ) : (
                    'Soumettre'
                  )}
                </span>
                {!isSubmitting && (
                  <span className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
