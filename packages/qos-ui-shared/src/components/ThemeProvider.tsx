"use client";

import React from 'react';
import { TamaguiProvider } from 'tamagui';
import appConfig from '../tamagui.config';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <TamaguiProvider config={appConfig} defaultTheme="dark">
      {children}
    </TamaguiProvider>
  );
};
