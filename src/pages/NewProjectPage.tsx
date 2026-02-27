import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Briefcase,
  FileText,
  Target,
  Users,
  Calendar,
  DollarSign,
  StickyNote,
  AlertCircle,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { EASING } from '@/lib/constants';
import { api } from '@/lib/api';
import type { Project, CreateProjectPayload } from '@/types';

const BUDGET_OPTIONS = [
  'Under LKR 50,000',
  'LKR 50,000 – 150,000',
  'LKR 150,000 – 500,000',
  'LKR 500,000 – 1,000,000',
  'LKR 1,000,000+',
  'Let\'s discuss',
];

const stagger = {
  container: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
  item: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASING } },
  },
};

export default function NewProjectPage() {
  const navigate = useNavigate();
  const toast = useToast();

  // Form state
  const [projectName, setProjectName] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');
  const [goals, setGoals] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [deadline, setDeadline] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!projectName.trim()) {
      setError('Project name is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: CreateProjectPayload = {
        project_name: projectName.trim(),
        industry: industry.trim() || undefined,
        description: description.trim() || undefined,
        goals: goals.trim() || undefined,
        target_audience: targetAudience.trim() || undefined,
        deadline: deadline || undefined,
        budget_range: budgetRange || undefined,
        additional_notes: additionalNotes.trim() || undefined,
      };

      await api.post<Project>('/projects', payload);
      setSuccess(true);
      toast.success('Project submitted!', 'We\'ll review your request and get started shortly.');

      // Redirect to dashboard after success animation
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err: any) {
      const msg = err.message || 'Failed to create project';
      setError(msg);
      toast.error('Submission failed', msg);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success state ───────────────────────────────────────
  if (success) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden portal-root p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="mb-12 flex h-24 w-24 items-center justify-center border border-white/[0.08] bg-white/[0.02] relative group rounded-sm overflow-hidden">
            <div className="absolute inset-0 bg-accent/5 backdrop-blur-xl group-hover:bg-accent/10 transition-colors" />
            <CheckCircle2 size={32} className="text-accent relative z-10" />
            <div className="absolute inset-1 border border-white/[0.03] pointer-events-none" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 justify-center mb-6">
              <div className="h-px w-10 bg-accent" />
              <span className="text-[10px] font-mono uppercase tracking-[0.5em] text-accent font-bold">Initialization_Success</span>
              <div className="h-px w-10 bg-accent" />
            </div>

            <h2 className="text-6xl md:text-8xl font-display font-black text-white uppercase tracking-tighter leading-[0.85] mb-6">
              Project<br />
              <span className="text-white/40 italic">Launched.</span>
            </h2>

            <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-[0.4em] max-w-sm leading-relaxed mx-auto">
              Architectural pipeline initialized // Strategic review in progress // Operator callback imminent
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-20 flex flex-col items-center gap-8"
          >
            <div className="h-24 w-px bg-gradient-to-b from-accent to-transparent opacity-50" />
            <span className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest animate-pulse font-bold">Redirecting_to_Command_Center...</span>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  const revealProps = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
  };

  return (
    <div className="mx-auto max-w-4xl px-8 py-20 lg:py-32">
      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="mb-12"
      >
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-4 group"
        >
          <div className="h-10 w-10 flex items-center justify-center border border-white/[0.08] bg-white/[0.02] group-hover:border-accent group-hover:text-accent transition-all duration-500">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600 group-hover:text-white transition-colors">Abort_Creation // Return_to_Base</span>
        </Link>
      </motion.div>

      <motion.div
        {...revealProps as any}
        className="mb-24"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px w-12 bg-accent" />
          <span className="text-[11px] font-mono uppercase tracking-[0.5em] text-accent font-bold">Project_Deployment.v2.4</span>
        </div>

        <h1 className="text-5xl md:text-8xl lg:text-9xl font-display font-black text-white tracking-tighter uppercase leading-[0.8] mb-10">
          Architect Your<br />
          <span className="text-white/40 italic">Next Standard.</span>
        </h1>

        <p className="text-lg text-zinc-500 font-sans max-w-2xl leading-relaxed">
          Define the blueprint for your upcoming project. Provide architectural constraints, strategic targets, and industrial specs to initialize your pipeline.
        </p>
      </motion.div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="relative">
        {/* Ornamental Side Track */}
        <div className="absolute -left-12 top-0 bottom-0 w-px bg-white/[0.03] hidden lg:block" />

        <motion.div
          variants={stagger.container}
          initial="initial"
          animate="animate"
          className="space-y-12"
        >
          {/* Section: Core Specs */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-mono font-bold text-accent uppercase tracking-[0.5em] mb-8">Section_01 // Core_Specs</h3>

            <motion.div variants={stagger.item}>
              <FormField
                icon={Briefcase}
                label="Project_Designation"
                required
              >
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Brand_Identity_Refresh // Platform_Launch"
                  maxLength={200}
                  required
                  className="w-full bg-[#080808] border border-white/[0.08] px-6 py-4 text-xs font-mono text-zinc-300 placeholder:text-zinc-800 focus:outline-none focus:border-accent/40 transition-all"
                />
              </FormField>
            </motion.div>

            <motion.div variants={stagger.item}>
              <FormField icon={Briefcase} label="Target_Industry">
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. FINTECH // AUTOMOTIVE // WEB3"
                  maxLength={100}
                  className="w-full bg-[#080808] border border-white/[0.08] px-6 py-4 text-xs font-mono text-zinc-300 placeholder:text-zinc-800 focus:outline-none focus:border-accent/40 transition-all"
                />
              </FormField>
            </motion.div>
          </div>

          {/* Section: Mission Profile */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-mono font-bold text-accent uppercase tracking-[0.5em] mb-8">Section_02 // Mission_Profile</h3>

            <motion.div variants={stagger.item}>
              <FormField icon={FileText} label="Mission_Abstract">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe the architectural vision and strategic objectives..."
                  maxLength={2000}
                  className="w-full bg-[#080808] border border-white/[0.08] px-6 py-4 text-xs font-mono text-zinc-300 placeholder:text-zinc-800 focus:outline-none focus:border-accent/40 transition-all resize-none"
                />
              </FormField>
            </motion.div>

            <motion.div variants={stagger.item}>
              <FormField icon={Target} label="Strategic_Goals">
                <textarea
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  rows={3}
                  placeholder="What are the critical success factors?"
                  maxLength={1000}
                  className="w-full bg-[#080808] border border-white/[0.08] px-6 py-4 text-xs font-mono text-zinc-300 placeholder:text-zinc-800 focus:outline-none focus:border-accent/40 transition-all resize-none"
                />
              </FormField>
            </motion.div>

            <motion.div variants={stagger.item}>
              <FormField icon={Users} label="Personnel_Target">
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Who is the end-user demographic?"
                  maxLength={500}
                  className="w-full bg-[#080808] border border-white/[0.08] px-6 py-4 text-xs font-mono text-zinc-300 placeholder:text-zinc-800 focus:outline-none focus:border-accent/40 transition-all"
                />
              </FormField>
            </motion.div>
          </div>

          {/* Section: Constraints */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-mono font-bold text-accent uppercase tracking-[0.5em] mb-8">Section_03 // Constraints</h3>

            <motion.div variants={stagger.item} className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <FormField icon={Calendar} label="Deployment_ETA">
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-[#080808] border border-white/[0.08] px-6 py-4 text-xs font-mono text-zinc-300 focus:outline-none focus:border-accent/40 transition-all"
                />
              </FormField>

              <FormField icon={DollarSign} label="Budget_Allocation">
                <div className="relative">
                  <select
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    className="w-full bg-[#080808] border border-white/[0.08] px-6 py-4 text-xs font-mono text-zinc-300 focus:outline-none focus:border-accent/40 appearance-none cursor-pointer transition-all"
                  >
                    <option value="" className="bg-[#050505] text-zinc-800">
                      Select_Range
                    </option>
                    {BUDGET_OPTIONS.map((opt) => (
                      <option key={opt} value={opt} className="bg-[#050505]">
                        {opt.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </FormField>
            </motion.div>

            <motion.div variants={stagger.item}>
              <FormField icon={StickyNote} label="Additional_Tech_Specs">
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  rows={4}
                  placeholder="References, brand guidelines, or specific architectural requirements..."
                  maxLength={2000}
                  className="w-full bg-[#080808] border border-white/[0.08] px-6 py-4 text-xs font-mono text-zinc-300 placeholder:text-zinc-800 focus:outline-none focus:border-accent/40 transition-all resize-none"
                />
              </FormField>
            </motion.div>
          </div>

          {/* Error Zone */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 p-6 bg-red-500/5 border border-red-500/10"
            >
              <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
              <p className="text-[10px] font-mono text-red-500 uppercase tracking-widest">{error}</p>
            </motion.div>
          )}

          {/* Submit */}
          <motion.div variants={stagger.item} className="pt-8 border-t border-white/[0.03]">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full h-16 group"
              loading={submitting}
              disabled={!projectName.trim()}
            >
              <Send size={16} className="mr-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              Execute_Project_Launch
            </Button>

            <p className="mt-6 text-center text-[9px] font-mono text-zinc-800 uppercase tracking-[0.3em]">
              By executing, you agree to our standard architectural terms // V2.4-SYS
            </p>
          </motion.div>
        </motion.div>
      </form>
    </div>
  );
}

// ─── Form Field wrapper ──────────────────────────────

function FormField({
  icon: Icon,
  label,
  required,
  children,
}: {
  icon: typeof Briefcase;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Icon size={14} className="text-zinc-800" />
        <label className="text-[9px] font-mono font-bold uppercase tracking-[0.3em] text-zinc-600">
          {label}
          {required && <span className="text-accent ml-2 text-[8px] underline">[ REDACTED_FIELD ]</span>}
        </label>
      </div>
      {children}
    </div>
  );
}
