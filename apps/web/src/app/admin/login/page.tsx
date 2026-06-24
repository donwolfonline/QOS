'use client';

import { useActionState } from 'react';
import { loginAction } from './actions';

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState(
    async (prevState: unknown, formData: FormData) => {
      return loginAction(formData);
    },
    null
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center font-mono p-4 relative overflow-hidden">
      {/* Matrix background effect (simplified via CSS) */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,65,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [transform:perspective(500px)_rotateX(60deg)] origin-bottom-center" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-black/80 border border-[#00ff41]/30 p-8 shadow-[0_0_30px_rgba(0,255,65,0.15)] backdrop-blur-sm">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-[#00ff41] text-3xl font-bold tracking-widest uppercase mb-2 drop-shadow-[0_0_8px_rgba(0,255,65,0.5)]">
            Q-OS Command
          </h1>
          <p className="text-[#00d4ff] text-xs tracking-widest uppercase opacity-80">
            Secure Authentication Gateway
          </p>
        </div>

        {/* Form */}
        <form action={formAction} className="space-y-6">
          <div>
            <label className="block text-[#00ff41] text-xs tracking-widest uppercase mb-2 opacity-80">
              System Passcode
            </label>
            <input
              type="password"
              name="passcode"
              placeholder="Enter Access Code..."
              disabled={isPending}
              className="w-full bg-black border border-[#00ff41]/50 text-[#00ff41] px-4 py-3 outline-none focus:border-[#00ff41] focus:ring-1 focus:ring-[#00ff41] transition-all disabled:opacity-50 placeholder:text-[#00ff41]/20 font-mono tracking-widest"
              required
            />
            {/* Try typing 'NEO' */}
          </div>

          {state?.error && (
            <div className="text-red-500 text-sm font-bold border border-red-500/50 bg-red-500/10 p-3 flex items-center gap-2">
              <span className="animate-pulse">⚠</span>
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-transparent border-2 border-[#00ff41] text-[#00ff41] font-bold tracking-widest uppercase py-3 hover:bg-[#00ff41] hover:text-black transition-all disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#00ff41] relative group overflow-hidden"
          >
            <span className="relative z-10">{isPending ? 'Authenticating...' : 'Initialize Override'}</span>
            {!isPending && (
              <div className="absolute inset-0 bg-[#00ff41] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out -z-0" />
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center border-t border-[#00ff41]/20 pt-4">
          <p className="text-[#00ff41]/50 text-[10px] tracking-widest uppercase">
            Unauthorized access strictly prohibited. Logs are monitored.
          </p>
        </div>
      </div>
    </div>
  );
}
