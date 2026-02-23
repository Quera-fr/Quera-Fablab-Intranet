import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';

// Nettoyage automatique après chaque test
afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});