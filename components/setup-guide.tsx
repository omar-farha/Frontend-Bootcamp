"use client"

import { useState } from "react"
import { X, Copy, Check, Database } from "lucide-react"

interface SetupGuideProps {
  isOpen: boolean
  onClose: () => void
}

export function SetupGuide({ isOpen, onClose }: SetupGuideProps) {
  const [copiedStep, setCopiedStep] = useState<string | null>(null)

  const copyToClipboard = (text: string, step: string) => {
    navigator.clipboard.writeText(text)
    setCopiedStep(step)
    setTimeout(() => setCopiedStep(null), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-[#0fd8d7] flex items-center">
            <Database className="w-8 h-8 mr-3" />
            Supabase Database Setup
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-8">
          {/* Step 1 */}
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center mb-4">
              <div className="bg-[#0fd8d7] text-black rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">
                1
              </div>
              <h3 className="text-xl font-semibold text-white">Create Supabase Project</h3>
            </div>
            <div className="ml-11 space-y-3">
              <p className="text-gray-300">
                1. Go to{" "}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0fd8d7] hover:underline"
                >
                  supabase.com
                </a>{" "}
                and create a new account or sign in
              </p>
              <p className="text-gray-300">2. Click "New Project" and fill in the details</p>
              <p className="text-gray-300">3. Wait for your project to be created (this may take a few minutes)</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center mb-4">
              <div className="bg-[#0fd8d7] text-black rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">
                2
              </div>
              <h3 className="text-xl font-semibold text-white">Get Environment Variables</h3>
            </div>
            <div className="ml-11 space-y-4">
              <p className="text-gray-300">
                1. In your Supabase dashboard, go to <strong>Settings → API</strong>
              </p>
              <p className="text-gray-300">2. Copy the following values:</p>

              <div className="space-y-3">
                <div className="bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-400">Project URL</span>
                    <button
                      onClick={() => copyToClipboard("NEXT_PUBLIC_SUPABASE_URL=your_project_url_here", "url")}
                      className="text-[#0fd8d7] hover:text-[#0bc5c4] transition-colors"
                    >
                      {copiedStep === "url" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <code className="text-green-400 text-sm">NEXT_PUBLIC_SUPABASE_URL=your_project_url_here</code>
                </div>

                <div className="bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-400">Anon Public Key</span>
                    <button
                      onClick={() => copyToClipboard("NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here", "key")}
                      className="text-[#0fd8d7] hover:text-[#0bc5c4] transition-colors"
                    >
                      {copiedStep === "key" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <code className="text-green-400 text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here</code>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center mb-4">
              <div className="bg-[#0fd8d7] text-black rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">
                3
              </div>
              <h3 className="text-xl font-semibold text-white">Configure Environment Variables</h3>
            </div>
            <div className="ml-11 space-y-3">
              <p className="text-gray-300">
                1. Create a <code className="bg-gray-700 px-2 py-1 rounded text-green-400">.env.local</code> file in
                your project root
              </p>
              <p className="text-gray-300">2. Add your Supabase credentials:</p>

              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-400">.env.local</span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here`,
                        "env",
                      )
                    }
                    className="text-[#0fd8d7] hover:text-[#0bc5c4] transition-colors"
                  >
                    {copiedStep === "env" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <pre className="text-green-400 text-sm">
                  {`NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here`}
                </pre>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center mb-4">
              <div className="bg-[#0fd8d7] text-black rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">
                4
              </div>
              <h3 className="text-xl font-semibold text-white">Run Database Scripts</h3>
            </div>
            <div className="ml-11 space-y-3">
              <p className="text-gray-300">
                1. In your Supabase dashboard, go to <strong>SQL Editor</strong>
              </p>
              <p className="text-gray-300">2. Run the database scripts in this order:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 ml-4">
                <li>
                  <code className="bg-gray-700 px-2 py-1 rounded text-green-400">
                    scripts/create-database-schema.sql
                  </code>
                </li>
                <li>
                  <code className="bg-gray-700 px-2 py-1 rounded text-green-400">scripts/create-functions.sql</code>
                </li>
                <li>
                  <code className="bg-gray-700 px-2 py-1 rounded text-green-400">scripts/seed-initial-data.sql</code>
                </li>
                <li>
                  <code className="bg-gray-700 px-2 py-1 rounded text-green-400">
                    scripts/update-projects-table.sql
                  </code>
                </li>
              </ul>
            </div>
          </div>

          {/* Step 5 */}
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center mb-4">
              <div className="bg-[#0fd8d7] text-black rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">
                5
              </div>
              <h3 className="text-xl font-semibold text-white">Restart Your Application</h3>
            </div>
            <div className="ml-11 space-y-3">
              <p className="text-gray-300">1. Stop your development server (Ctrl+C)</p>
              <p className="text-gray-300">2. Restart it with:</p>

              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-400">Terminal Command</span>
                  <button
                    onClick={() => copyToClipboard("npm run dev", "restart")}
                    className="text-[#0fd8d7] hover:text-[#0bc5c4] transition-colors"
                  >
                    {copiedStep === "restart" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <code className="text-green-400 text-sm">npm run dev</code>
              </div>
            </div>
          </div>

          {/* Success Message */}
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
            <div className="flex items-center mb-3">
              <Check className="w-6 h-6 text-green-400 mr-3" />
              <h3 className="text-lg font-semibold text-green-400">You're All Set!</h3>
            </div>
            <p className="text-green-300">
              Once you complete these steps, your application will be using Supabase as the production database. All
              data will be persistent and the admin panel will show the production status.
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-[#0fd8d7] to-[#0bc5c4] text-black font-semibold py-3 px-6 rounded-lg hover:from-[#0bc5c4] hover:to-[#0fd8d7] transition-all duration-300"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  )
}
