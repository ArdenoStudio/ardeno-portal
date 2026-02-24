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
  'Under $1,000',
  '$1,000 - $5,000',
  '$5,000 - $10,000',
  '$10,000 - $25,000',
  '$25,000+',
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
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: EASING }}
        >
          <GlassCard hover={false} className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1, ease: EASING }}
              className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10"
            >
              <CheckCircle2 size={32} className="text-emerald-400" />
            </motion.div>
            <h2 className="text-xl font-display font-bold text-white">
              Project Submitted!
            </h2>
            <p className="mt-2 text-sm text-zinc-500 max-w-xs">
              We&apos;ll review your request and get started on your project shortly.
            </p>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors duration-200"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: EASING }}
        className="mt-6 mb-8"
      >
        <h1 className="text-2xl font-display font-bold text-white sm:text-3xl">
          Request a New Project
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Tell us about your project and we&apos;ll get started right away.
        </p>
      </motion.div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <motion.div
          variants={stagger.container}
          initial="initial"
          animate="animate"
          className="space-y-5"
        >
          {/* Project Name (required) */}
          <motion.div variants={stagger.item}>
            <GlassCard hover={false} className="p-5">
              <FormField
                icon={Briefcase}
                label="Project Name"
                required
              >
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Brand Refresh, E-Commerce Platform"
                  maxLength={200}
                  required
                  className="w-full bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                />
              </FormField>
            </GlassCard>
          </motion.div>

          {/* Industry */}
          <motion.div variants={stagger.item}>
            <GlassCard hover={false} className="p-5">
              <FormField icon={Briefcase} label="Industry">
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. FinTech, Fashion & Retail, SaaS"
                  maxLength={100}
                  className="w-full bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                />
              </FormField>
            </GlassCard>
          </motion.div>

          {/* Description */}
          <motion.div variants={stagger.item}>
            <GlassCard hover={false} className="p-5">
              <FormField icon={FileText} label="Description">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe your project vision and what you'd like to achieve..."
                  maxLength={2000}
                  className="w-full bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none"
                />
              </FormField>
            </GlassCard>
          </motion.div>

          {/* Goals */}
          <motion.div variants={stagger.item}>
            <GlassCard hover={false} className="p-5">
              <FormField icon={Target} label="Goals">
                <textarea
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  rows={2}
                  placeholder="What are the key objectives for this project?"
                  maxLength={1000}
                  className="w-full bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none"
                />
              </FormField>
            </GlassCard>
          </motion.div>

          {/* Target Audience */}
          <motion.div variants={stagger.item}>
            <GlassCard hover={false} className="p-5">
              <FormField icon={Users} label="Target Audience">
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Who is your target audience?"
                  maxLength={500}
                  className="w-full bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                />
              </FormField>
            </GlassCard>
          </motion.div>

          {/* Deadline + Budget row */}
          <motion.div variants={stagger.item} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <GlassCard hover={false} className="p-5">
              <FormField icon={Calendar} label="Deadline">
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-transparent text-sm text-zinc-200 focus:outline-none"
                />
              </FormField>
            </GlassCard>

            <GlassCard hover={false} className="p-5">
              <FormField icon={DollarSign} label="Budget Range">
                <select
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  className="w-full bg-transparent text-sm text-zinc-200 focus:outline-none appearance-none"
                >
                  <option value="" className="bg-zinc-900 text-zinc-500">
                    Select a range
                  </option>
                  {BUDGET_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} className="bg-zinc-900">
                      {opt}
                    </option>
                  ))}
                </select>
              </FormField>
            </GlassCard>
          </motion.div>

          {/* Additional Notes */}
          <motion.div variants={stagger.item}>
            <GlassCard hover={false} className="p-5">
              <FormField icon={StickyNote} label="Additional Notes">
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  rows={3}
                  placeholder="Any references, brand guidelines, or specific requirements..."
                  maxLength={2000}
                  className="w-full bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none"
                />
              </FormField>
            </GlassCard>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3"
            >
              <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </motion.div>
          )}

          {/* Submit */}
          <motion.div variants={stagger.item} className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={submitting}
              disabled={!projectName.trim()}
            >
              <Send size={16} />
              Submit Project Request
            </Button>
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
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className="text-zinc-600" />
        <label className="text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-500">
          {label}
          {required && <span className="text-accent ml-1">*</span>}
        </label>
      </div>
      {children}
    </div>
  );
}
