'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const [loading, setLoading] = useState(false)
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
    setLoading(true)

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
      router.push(`/confirmation?id=${result.id}`)
    } catch (error) {
      console.error('Error:', error)
      alert('Une erreur est survenue. Veuillez réessayer.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="card bg-base-200 shadow-2xl">
          <div className="card-body p-8 md:p-12">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-primary mb-2">
                Décrivez votre besoin
              </h1>
              <p className="text-base-content/70">
                Notre IA analysera votre demande et vous proposera une solution adaptée
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informations client */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Nom complet *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="input input-bordered input-primary w-full"
                    placeholder="Votre nom"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Email</span>
                  </label>
                  <input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    className="input input-bordered input-primary w-full"
                    placeholder="email@example.com"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Téléphone</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    className="input input-bordered input-primary w-full"
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Entreprise</span>
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="input input-bordered input-primary w-full"
                    placeholder="Nom de l'entreprise"
                  />
                </div>
              </div>

              {/* Problème */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Problème à résoudre *</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.problemDescription}
                  onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
                  className="textarea textarea-bordered textarea-primary"
                  placeholder="Décrivez le problème que vous souhaitez résoudre..."
                />
              </div>

              {/* Situation actuelle */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Situation actuelle *</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.currentSituation}
                  onChange={(e) => setFormData({ ...formData, currentSituation: e.target.value })}
                  className="textarea textarea-bordered textarea-primary"
                  placeholder="Comment gérez-vous actuellement ce problème ?"
                />
              </div>

              {/* Solution souhaitée */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Solution souhaitée *</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.desiredSolution}
                  onChange={(e) => setFormData({ ...formData, desiredSolution: e.target.value })}
                  className="textarea textarea-bordered textarea-primary"
                  placeholder="Quelle solution idéale imaginez-vous ?"
                />
              </div>

              {/* Références */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Applications similaires (références)</span>
                </label>
                <input
                  type="text"
                  value={formData.knownAppReferences}
                  onChange={(e) => setFormData({ ...formData, knownAppReferences: e.target.value })}
                  className="input input-bordered input-primary w-full"
                  placeholder="Ex: Airbnb, Uber, Notion..."
                />
              </div>

              {/* Budget et délai */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Budget minimum (€)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.budgetMin}
                    onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                    className="input input-bordered input-primary w-full"
                    placeholder="0"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Budget maximum (€)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.budgetMax}
                    onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                    className="input input-bordered input-primary w-full"
                    placeholder="0"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Délai souhaité</span>
                  </label>
                  <input
                    type="text"
                    value={formData.deadlinePreference}
                    onChange={(e) => setFormData({ ...formData, deadlinePreference: e.target.value })}
                    className="input input-bordered input-primary w-full"
                    placeholder="Ex: 3 mois, ASAP..."
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Priorité</span>
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="select select-bordered select-primary w-full"
                  >
                    <option value="LOW">Basse</option>
                    <option value="MEDIUM">Moyenne</option>
                    <option value="HIGH">Haute</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Langue</span>
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="select select-bordered select-primary w-full"
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
              <FileUploader onFilesChange={setFiles} />

              {/* Submit */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary btn-block btn-lg"
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Envoi en cours...
                    </>
                  ) : (
                    'Soumettre mon besoin'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
