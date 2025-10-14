"use client";

import { useState, useEffect } from "react";
import { Loader2Icon, XCircleIcon, ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ToolStep {
  stepNumber: number;
  toolName: string;
  status: "pending" | "executing" | "completed" | "failed";
  startTime?: number;
  endTime?: number;
}

interface MultiStepProgressProps {
  steps: ToolStep[];
  maxSteps: number;
  onAbort?: () => void;
  isActive: boolean;
}

export function MultiStepProgress({
  steps,
  maxSteps,
  onAbort,
  isActive,
}: MultiStepProgressProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  // Calculate elapsed time for active step
  useEffect(() => {
    if (!isActive) {
      setElapsedTime(0);
      return;
    }

    const activeStep = steps.find((s) => s.status === "executing");
    if (!activeStep || !activeStep.startTime) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - activeStep.startTime!;
      setElapsedTime(elapsed);
    }, 100);

    return () => clearInterval(interval);
  }, [steps, isActive]);

  const currentStep = steps.length;
  const activeStep = steps.find((s) => s.status === "executing");

  if (!isActive && steps.length === 0) return null;

  return (
    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Loader2Icon className="size-4 animate-spin text-blue-600" />
          <span className="text-sm font-semibold text-blue-900">
            Multi-Step Workflow
          </span>
          <span className="text-xs text-blue-600">
            Step {currentStep} of {maxSteps}
          </span>
        </div>
        {onAbort && isActive && (
          <Button
            onClick={onAbort}
            size="sm"
            variant="ghost"
            className="text-red-600 hover:bg-red-100 hover:text-red-700"
          >
            <XCircleIcon className="mr-1 size-3" />
            Abort
          </Button>
        )}
      </div>

      {/* Tool Chain Visualization */}
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className={`rounded-md px-2 py-1 text-xs font-medium ${
                step.status === "executing"
                  ? "bg-blue-200 text-blue-900 ring-2 ring-blue-400"
                  : step.status === "completed"
                  ? "bg-green-100 text-green-800"
                  : step.status === "failed"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {step.stepNumber}. {step.toolName}
              {step.status === "executing" && (
                <span className="ml-1">
                  ({(elapsedTime / 1000).toFixed(1)}s)
                </span>
              )}
              {step.status === "completed" &&
                step.startTime &&
                step.endTime && (
                  <span className="ml-1">
                    ({((step.endTime - step.startTime) / 1000).toFixed(1)}s)
                  </span>
                )}
            </div>
            {index < steps.length - 1 && (
              <ArrowRightIcon className="size-3 text-gray-400" />
            )}
          </div>
        ))}
      </div>

      {/* Active Step Info */}
      {activeStep && (
        <div className="mt-3 border-t border-blue-200 pt-2 text-xs text-blue-700">
          Currently executing: <code className="font-semibold">{activeStep.toolName}</code>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${(currentStep / maxSteps) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
