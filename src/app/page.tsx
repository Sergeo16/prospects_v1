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
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center">Décrivez votre besoin</h1>

      <form 
        onSubmit={handleSubmit} 
        className="card bg-base-100 shadow-xl transition-all duration-300 hover:outline hover:outline-[4px] hover:outline-accent hover:outline-offset-2"
      >
        <div className="card-body p-4 sm:p-6 pb-8">
          <p className="text-base-content/70 mb-6 text-center">
            Notre IA analysera votre demande et vous proposera une solution adaptée
          </p>

          {/* Informations client */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Nom complet *</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                placeholder="Saisissez votre nom complet"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                className="input input-bordered"
                placeholder="email@example.com"
                value={formData.clientEmail}
                onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Téléphone</span>
              </label>
              <input
                type="tel"
                className="input input-bordered"
                placeholder="+33 6 12 34 56 78"
                value={formData.clientPhone}
                onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Entreprise</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                placeholder="Nom de l'entreprise"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>
          </div>

          {/* Problème */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Problème à résoudre *</span>
            </label>
            <textarea
              className="textarea textarea-bordered"
              placeholder="Décrivez le problème que vous souhaitez résoudre..."
              rows={4}
              value={formData.problemDescription}
              onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
              required
            />
          </div>

          {/* Situation actuelle */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Situation actuelle *</span>
            </label>
            <textarea
              className="textarea textarea-bordered"
              placeholder="Comment gérez-vous actuellement ce problème ?"
              rows={4}
              value={formData.currentSituation}
              onChange={(e) => setFormData({ ...formData, currentSituation: e.target.value })}
              required
            />
          </div>

          {/* Solution souhaitée */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Solution souhaitée *</span>
            </label>
            <textarea
              className="textarea textarea-bordered"
              placeholder="Quelle solution idéale imaginez-vous ?"
              rows={4}
              value={formData.desiredSolution}
              onChange={(e) => setFormData({ ...formData, desiredSolution: e.target.value })}
              required
            />
          </div>

          {/* Références */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Applications similaires (références)</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              placeholder="Ex: Airbnb, Uber, Notion..."
              value={formData.knownAppReferences}
              onChange={(e) => setFormData({ ...formData, knownAppReferences: e.target.value })}
            />
          </div>

          {/* Budget et délai */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Budget minimum (€)</span>
              </label>
              <input
                type="number"
                className="input input-bordered"
                placeholder="0"
                min="0"
                value={formData.budgetMin}
                onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                onFocus={(e) => e.target.select()}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Budget maximum (€)</span>
              </label>
              <input
                type="number"
                className="input input-bordered"
                placeholder="0"
                min="0"
                value={formData.budgetMax}
                onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                onFocus={(e) => e.target.select()}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Délai souhaité</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                placeholder="Ex: 3 mois, ASAP..."
                value={formData.deadlinePreference}
                onChange={(e) => setFormData({ ...formData, deadlinePreference: e.target.value })}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Priorité</span>
              </label>
              <select
                className="select select-bordered"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              >
                <option value="LOW">Basse</option>
                <option value="MEDIUM">Moyenne</option>
                <option value="HIGH">Haute</option>
              </select>
            </div>

            <div className="form-control sm:col-span-2">
              <label className="label">
                <span className="label-text">Langue</span>
              </label>
              <select
                className="select select-bordered"
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

          {/* Upload fichiers */}
          <div className="mt-4">
            <FileUploader onFilesChange={setFiles} />
          </div>

          {/* Boutons */}
          <div className="form-control mt-6">
            <div className="flex gap-4">
              <button
                type="button"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg 
                          transition-all duration-300 transform hover:scale-105 hover:shadow-lg 
                          active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg 
                          transition-all duration-300 transform hover:scale-105 hover:shadow-lg 
                          active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Envoi...' : 'Soumettre'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
