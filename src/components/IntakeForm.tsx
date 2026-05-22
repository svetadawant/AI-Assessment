'use client'

import { useState } from 'react'
import type { IntakeData } from '@/lib/types'

interface IntakeFormProps {
  initial: IntakeData
  onSubmit: (data: IntakeData) => void
  title?: string
}

export function IntakeForm({ initial, onSubmit, title = 'Organizational AI Maturity Assessment' }: IntakeFormProps) {
  const [values, setValues] = useState<IntakeData>(initial)
  const [errors, setErrors] = useState<Partial<Record<keyof IntakeData, string>>>({})

  function validate(): boolean {
    const e: Partial<Record<keyof IntakeData, string>> = {}
    if (!values.first_name.trim()) e.first_name = 'First name is required'
    if (!values.last_name.trim()) e.last_name = 'Last name is required'
    if (!values.title.trim()) e.title = 'Your title is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (validate()) {
      onSubmit({
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        title: values.title.trim(),
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-8 w-full max-w-lg">
        {/* Guild Academy logo */}
        <div className="flex justify-center mb-6">
          <img src="/guild-academy.png" alt="Guild Academy" className="h-12 w-auto" />
        </div>

        <div className="flex flex-col items-center mb-8">
          <img src="/qr-code.png" alt="QR code" className="w-48 h-48 rounded-xl mb-4" />
          <p className="text-gray-400 text-xs tracking-wide uppercase">Scan to take the assessment</p>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
        <p className="text-gray-300 mb-8 text-sm">
          Let&apos;s get started.
        </p>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1" htmlFor="first_name">
                First Name
              </label>
              <input
                id="first_name"
                type="text"
                value={values.first_name}
                onChange={e => setValues(v => ({ ...v, first_name: e.target.value }))}
                className={`w-full border rounded-lg px-3 py-2 text-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.first_name ? 'border-red-400' : 'border-gray-600'
                }`}
              />
              {errors.first_name && (
                <p className="text-red-400 text-xs mt-1">{errors.first_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1" htmlFor="last_name">
                Last Name
              </label>
              <input
                id="last_name"
                type="text"
                value={values.last_name}
                onChange={e => setValues(v => ({ ...v, last_name: e.target.value }))}
                className={`w-full border rounded-lg px-3 py-2 text-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.last_name ? 'border-red-400' : 'border-gray-600'
                }`}
              />
              {errors.last_name && (
                <p className="text-red-400 text-xs mt-1">{errors.last_name}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1" htmlFor="title">
              Your Title
            </label>
            <input
              id="title"
              type="text"
              value={values.title}
              onChange={e => setValues(v => ({ ...v, title: e.target.value }))}
              className={`w-full border rounded-lg px-3 py-2 text-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-400' : 'border-gray-600'
              }`}
            />
            {errors.title && (
              <p className="text-red-400 text-xs mt-1">{errors.title}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full text-white font-medium py-2.5 rounded-lg text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#E7651C' }}
          >
            Start Assessment →
          </button>
        </form>
      </div>
    </div>
  )
}
