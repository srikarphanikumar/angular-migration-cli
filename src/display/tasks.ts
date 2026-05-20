import { Listr, type ListrTask } from 'listr2';
import type { MigrationStep, PackageKey, ProjectInfo } from '../types.js';

export interface StepTaskContext {
  projectInfo: ProjectInfo;
}

export function buildStepTaskList(
  step: MigrationStep,
  selectedPackages: PackageKey[],
): Listr<StepTaskContext> {
  const tasks: ListrTask<StepTaskContext>[] = step.tasks.map((taskDefinition) => ({
    title: taskDefinition.label,
    task: async (ctx) => {
      await taskDefinition.run(ctx.projectInfo, selectedPackages);
    },
  }));

  return new Listr<StepTaskContext>(tasks, {
    concurrent: false,
    exitOnError: true,
    rendererOptions: {
      collapseSubtasks: false,
    },
  });
}
