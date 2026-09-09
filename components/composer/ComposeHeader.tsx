import React from 'react';

import { ZooHelpHeader } from '@/components/ZooHelpHeader';

import type { ComposerColors, ComposerPostType } from './types';

type ComposeHeaderProps = {
  topPad: number;
  colors: ComposerColors;
  currentType: ComposerPostType;
  progress: number;
  onCancel: () => void;
};

export function ComposeHeader({
  onCancel,
}: ComposeHeaderProps) {
  return <ZooHelpHeader onBack={onCancel} />;
}
