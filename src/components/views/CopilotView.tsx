import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  PhoneCall,
  RotateCcw,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import {
  COPILOT_GUIDES,
  type TroubleshootingGuide,
} from '../../data/copilotGuides';
import { useApp } from '../../context/AppContext';

type SessionOutcome =
  | null
  | { type: 'resolved'; message: string }
  | { type: 'call-pro'; message: string };

export function CopilotView() {
  const { state, navigate } = useApp();
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const [linkedAssetId, setLinkedAssetId] = useState<string>('');
  const [stepIndex, setStepIndex] = useState(0);
  const [outcome, setOutcome] = useState<SessionOutcome>(null);
  const [stepHistory, setStepHistory] = useState<
    { stepTitle: string; answer: string }[]
  >([]);

  const activeGuide: TroubleshootingGuide | null = useMemo(
    () => COPILOT_GUIDES.find((g) => g.id === selectedGuideId) ?? null,
    [selectedGuideId]
  );

  const matchingAssets = useMemo(() => {
    if (!activeGuide) return [];
    return state.assets.filter((a) => a.category === activeGuide.category);
  }, [activeGuide, state.assets]);

  const startGuide = (guide: TroubleshootingGuide) => {
    setSelectedGuideId(guide.id);
    const firstMatch = state.assets.find((a) => a.category === guide.category);
    setLinkedAssetId(firstMatch?.id ?? '');
    setStepIndex(0);
    setOutcome(null);
    setStepHistory([]);
  };

  const resetCurrentGuide = () => {
    setStepIndex(0);
    setOutcome(null);
    setStepHistory([]);
  };

  const handleAnswer = (answer: 'yes' | 'no') => {
    if (!activeGuide) return;
    const step = activeGuide.steps[stepIndex];
    const nextHistory = [
      ...stepHistory,
      {
        stepTitle: step.title,
        answer: answer === 'yes' ? 'Yes' : 'No',
      },
    ];
    setStepHistory(nextHistory);

    // Special case: Electrical hazard stop check (step el-1) where YES means stop immediately
    if (step.id === 'el-1' && answer === 'yes') {
      setOutcome({
        type: 'call-pro',
        message: step.yesOutcome,
      });
      return;
    }

    if (answer === 'yes') {
      setOutcome({
        type: 'resolved',
        message: step.yesOutcome,
      });
      return;
    }

    // Answer is NO -> move to next step or recommend professional
    if (stepIndex < activeGuide.steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      setOutcome({
        type: 'call-pro',
        message:
          step.noNextHint ||
          'Basic homeowner checks did not resolve the fault. Contact a qualified technician for safe diagnosis and repair.',
      });
    }
  };

  if (!activeGuide) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#0F1D33] tracking-tight">
              SmartFix Copilot
            </h1>
            <p className="text-sm text-[#64748B] mt-1 max-w-2xl">
              Interactive, offline homeowner diagnostic guides. Step through safe
              checks without needing an internet connection or external AI API.
            </p>
          </div>
          <span className="text-xs font-medium text-[#64748B]">
            Structured Offline Diagnostic Guides
          </span>
        </div>

        {/* Universal Safety Banner */}
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
          <ShieldAlert className="w-5 h-5 text-[#B91C1C] shrink-0 mt-0.5" />
          <div className="text-sm text-[#7F1D1D] leading-relaxed">
            <p className="font-semibold text-[#991B1B]">
              Safety First — Know When to Call a Licensed Professional
            </p>
            <p className="mt-1">
              Never attempt DIY repairs on live electrical panels, gas lines,
              pressurized refrigerant circuits, or battery acid leaks. If you
              smell gas or burning plastic, see sparks, or suspect a hidden pipe
              burst, stop immediately and contact a qualified technician.
            </p>
          </div>
        </div>

        {/* 7 Interactive Troubleshooting Guides */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {COPILOT_GUIDES.map((guide) => {
            const isHighRisk = guide.riskLevel === 'High Safety Risk';
            return (
              <button
                key={guide.id}
                type="button"
                onClick={() => startGuide(guide)}
                className="text-left bg-white border border-[#E6E3DC] hover:border-[#0D7A7A] rounded-2xl p-5 flex flex-col justify-between transition-colors group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#64748B]">{guide.category}</span>
                    <span
                      className={`font-semibold ${
                        isHighRisk
                          ? 'text-[#B91C1C]'
                          : guide.riskLevel === 'Moderate'
                            ? 'text-[#B45309]'
                            : 'text-[#15803D]'
                      }`}
                    >
                      {guide.riskLevel}
                    </span>
                  </div>

                  <h2 className="font-display text-base font-bold text-[#0F1D33] mt-2 group-hover:text-[#0D7A7A] transition-colors">
                    {guide.title}
                  </h2>
                  <p className="text-sm text-[#475569] mt-1.5 leading-relaxed">
                    {guide.summary}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-[#ECE9E2] flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">
                    {guide.steps.length} safe steps · {guide.estimatedTime}
                  </span>
                  <span className="font-semibold text-[#0D7A7A] inline-flex items-center gap-1">
                    Start Guide
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const currentStep = activeGuide.steps[stepIndex];
  const selectedAsset = state.assets.find((a) => a.id === linkedAssetId);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setSelectedGuideId(null)}
          className="min-h-[40px] inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F1D33] hover:text-[#0D7A7A]"
        >
          <ArrowLeft className="w-4 h-4" />
          All Troubleshooting Guides
        </button>

        <button
          type="button"
          onClick={resetCurrentGuide}
          className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DCD8CF] bg-white hover:bg-[#F3F1EC] text-xs font-semibold text-[#334155]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restart Guide
        </button>
      </div>

      {/* Guide Header + Linked Asset Selector */}
      <div className="bg-white border border-[#E6E3DC] rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <p className="text-xs text-[#64748B]">
              {activeGuide.category} · Guided Offline Checklist ·{' '}
              <span
                className={`font-semibold ${
                  activeGuide.riskLevel === 'High Safety Risk'
                    ? 'text-[#B91C1C]'
                    : activeGuide.riskLevel === 'Moderate'
                      ? 'text-[#B45309]'
                      : 'text-[#15803D]'
                }`}
              >
                {activeGuide.riskLevel}
              </span>
            </p>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-[#0F1D33] mt-1">
              {activeGuide.title}
            </h1>
          </div>

          {state.assets.length > 0 && (
            <div className="sm:w-64">
              <label
                htmlFor="copilot-asset"
                className="block text-xs font-semibold text-[#64748B] mb-1"
              >
                Link Saved Appliance (Optional)
              </label>
              <select
                id="copilot-asset"
                value={linkedAssetId}
                onChange={(e) => setLinkedAssetId(e.target.value)}
                className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#DCD8CF] bg-[#FAF9F6] text-xs text-[#0F1D33] focus:bg-white focus:border-[#0D7A7A] focus:outline-none"
              >
                <option value="">General / Not linked</option>
                {matchingAssets.length > 0 && (
                  <optgroup label={`Matching ${activeGuide.category}`}>
                    {matchingAssets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="All Assets">
                  {state.assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.category})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}
        </div>

        {/* Mandatory Pre-Check Safety Notice */}
        <div
          className={`rounded-xl p-4 border flex items-start gap-3 ${
            activeGuide.riskLevel === 'High Safety Risk'
              ? 'bg-[#FEF2F2] border-[#FECACA] text-[#7F1D1D]'
              : 'bg-[#FFFBEB] border-[#FDE68A] text-[#78350F]'
          }`}
        >
          <AlertTriangle
            className={`w-5 h-5 shrink-0 mt-0.5 ${
              activeGuide.riskLevel === 'High Safety Risk'
                ? 'text-[#B91C1C]'
                : 'text-[#B45309]'
            }`}
          />
          <p className="text-sm leading-relaxed">
            {activeGuide.preCheckSafetyBanner}
          </p>
        </div>
      </div>

      {/* Interactive Stepper or Final Outcome */}
      {outcome ? (
        <div className="bg-white border border-[#E6E3DC] rounded-2xl p-6 space-y-5">
          <div className="flex items-start gap-3.5">
            {outcome.type === 'resolved' ? (
              <CheckCircle2 className="w-6 h-6 text-[#15803D] shrink-0 mt-0.5" />
            ) : (
              <PhoneCall className="w-6 h-6 text-[#B91C1C] shrink-0 mt-0.5" />
            )}
            <div>
              <h2 className="font-display text-lg font-bold text-[#0F1D33]">
                {outcome.type === 'resolved'
                  ? 'Troubleshooting Complete'
                  : 'Professional Service Recommended'}
              </h2>
              <p className="text-sm text-[#334155] mt-1.5 leading-relaxed">
                {outcome.message}
              </p>
              {outcome.type === 'call-pro' && (
                <p className="text-xs text-[#64748B] mt-2">
                  {selectedAsset?.serviceProvider
                    ? `Saved Service Provider: ${selectedAsset.serviceProvider}`
                    : state.settings.emergencyContact
                      ? `Home Emergency Contact: ${state.settings.emergencyContact}`
                      : 'Tip: Save your preferred licensed technician in Settings or Asset Details for quick reference.'}
                </p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#ECE9E2] flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() =>
                navigate('repairs', {
                  openCreate: true,
                  prefillAssetId: linkedAssetId,
                  prefillTitle: activeGuide.title,
                  prefillNotes: `Copilot checks performed: ${stepHistory
                    .map((h) => `${h.stepTitle} (${h.answer})`)
                    .join('; ')}.`,
                })
              }
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0D7A7A] hover:bg-[#0A6363] text-white text-sm font-semibold inline-flex items-center gap-2"
            >
              <Wrench className="w-4 h-4" />
              Log as Repair Record
            </button>
            <button
              type="button"
              onClick={() =>
                navigate('maintenance', {
                  openCreate: true,
                  prefillAssetId: linkedAssetId,
                  prefillTitle: `Follow-up check: ${activeGuide.title}`,
                  prefillNotes: activeGuide.preventiveTip,
                })
              }
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#DCD8CF] bg-white hover:bg-[#F3F1EC] text-[#0F1D33] text-sm font-semibold inline-flex items-center gap-2"
            >
              <CalendarClock className="w-4 h-4 text-[#0D7A7A]" />
              Schedule Preventive Maintenance
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#E6E3DC] rounded-2xl p-6 space-y-5">
          {/* Progress header */}
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-semibold text-[#0D7A7A] tabular-nums">
              Step {stepIndex + 1} of {activeGuide.steps.length}
            </span>
            <span>Follow carefully before answering</span>
          </div>

          <div className="w-full h-1.5 bg-[#ECE9E2] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0D7A7A] transition-all duration-200"
              style={{
                width: `${Math.round(
                  ((stepIndex + 1) / activeGuide.steps.length) * 100
                )}%`,
              }}
            />
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-[#0F1D33]">
              {currentStep.title}
            </h2>
            <p className="text-sm sm:text-base text-[#334155] leading-relaxed mt-2">
              {currentStep.instruction}
            </p>
          </div>

          {currentStep.safetyNote && (
            <div className="rounded-xl bg-[#FEF2F2] border border-[#FECACA] px-4 py-3 text-xs sm:text-sm text-[#991B1B]">
              <strong className="font-semibold">Safety reminder:</strong>{' '}
              {currentStep.safetyNote}
            </div>
          )}

          <div className="pt-4 border-t border-[#ECE9E2] space-y-3">
            <p className="text-sm font-semibold text-[#0F1D33]">
              {currentStep.checkQuestion}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleAnswer('yes')}
                className={`min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  currentStep.id === 'el-1'
                    ? 'bg-[#B91C1C] hover:bg-[#991B1B] text-white'
                    : 'bg-[#0D7A7A] hover:bg-[#0A6363] text-white'
                }`}
              >
                {currentStep.id === 'el-1'
                  ? 'Yes — Stop & Call Electrician'
                  : 'Yes, this resolved it'}
              </button>
              <button
                type="button"
                onClick={() => handleAnswer('no')}
                className="min-h-[44px] px-5 py-2.5 rounded-xl border border-[#DCD8CF] bg-white hover:bg-[#F3F1EC] text-sm font-semibold text-[#0F1D33] transition-colors"
              >
                {currentStep.id === 'el-1'
                  ? 'No hazards observed — Continue safely'
                  : stepIndex < activeGuide.steps.length - 1
                    ? 'No — Next Check'
                    : 'No — Recommend Technician'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stop & Call Pro Reference + Preventive Tip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-[#E6E3DC] rounded-2xl p-5">
          <h3 className="font-display text-sm font-bold text-[#991B1B]">
            Stop Immediately & Call a Qualified Professional If:
          </h3>
          <ul className="mt-3 space-y-2 text-xs sm:text-sm text-[#334155] list-disc pl-4">
            {activeGuide.stopAndCallProSigns.map((sign) => (
              <li key={sign}>{sign}</li>
            ))}
          </ul>
        </div>

        <div className="bg-white border border-[#E6E3DC] rounded-2xl p-5">
          <h3 className="font-display text-sm font-bold text-[#0F1D33]">
            Preventive Care Recommendation
          </h3>
          <p className="mt-2.5 text-xs sm:text-sm text-[#475569] leading-relaxed">
            {activeGuide.preventiveTip}
          </p>
        </div>
      </div>
    </div>
  );
}
