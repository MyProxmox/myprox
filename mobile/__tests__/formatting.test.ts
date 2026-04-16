import {
  formatBytes, formatCPU, formatRAM, formatUptime,
  getStatusColor, getCPUColor, getRAMColor,
  getCPUPercent, getRAMPercent,
} from '../src/utils/formatting';

describe('formatBytes', () => {
  it('returns 0 B for 0', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('formats KB correctly', () => {
    expect(formatBytes(1024)).toBe('1 KB');       // parseFloat strips trailing zero
    expect(formatBytes(1536)).toBe('1.5 KB');     // non-round value keeps decimal
  });

  it('formats MB correctly', () => {
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
    expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });

  it('formats GB correctly', () => {
    expect(formatBytes(2 * 1024 * 1024 * 1024)).toBe('2 GB');
    expect(formatBytes(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB');
  });
});

describe('formatCPU', () => {
  it('formats 0 as 0.0%', () => {
    expect(formatCPU(0)).toBe('0.0%');
  });

  it('formats 0.5 as 50.0%', () => {
    expect(formatCPU(0.5)).toBe('50.0%');
  });

  it('formats 1 as 100.0%', () => {
    expect(formatCPU(1)).toBe('100.0%');
  });
});

describe('formatRAM', () => {
  it('returns dash if total is 0', () => {
    expect(formatRAM(0, 0)).toBe('-');
  });

  it('formats used/total with percentage', () => {
    const result = formatRAM(512 * 1024 * 1024, 1024 * 1024 * 1024);
    expect(result).toContain('50%');
  });
});

describe('formatUptime', () => {
  it('returns dash for 0', () => {
    expect(formatUptime(0)).toBe('-');
  });

  it('formats minutes', () => {
    expect(formatUptime(120)).toBe('2m');
  });

  it('formats hours and minutes', () => {
    expect(formatUptime(3720)).toBe('1h 2m');
  });

  it('formats days and hours', () => {
    expect(formatUptime(90000)).toBe('1j 1h');
  });
});

describe('getStatusColor', () => {
  it('returns green for running', () => {
    expect(getStatusColor('running')).toBe('#4CAF50');
  });

  it('returns red for stopped', () => {
    expect(getStatusColor('stopped')).toBe('#f44336');
  });

  it('returns grey for unknown', () => {
    expect(getStatusColor('unknown')).toBe('#999');
  });
});

describe('getCPUColor', () => {
  it('returns green below 60%', () => {
    expect(getCPUColor(0.5)).toBe('#4CAF50');
  });

  it('returns orange between 60% and 85%', () => {
    expect(getCPUColor(0.7)).toBe('#FF9800');
  });

  it('returns red at or above 85%', () => {
    expect(getCPUColor(0.9)).toBe('#f44336');
  });
});

describe('getRAMColor', () => {
  it('returns grey for zero max', () => {
    expect(getRAMColor(0, 0)).toBe('#999');
  });

  it('returns green below 60%', () => {
    expect(getRAMColor(500, 1000)).toBe('#4CAF50');
  });

  it('returns red at 90%', () => {
    expect(getRAMColor(900, 1000)).toBe('#f44336');
  });
});

describe('getCPUPercent', () => {
  it('clamps to 0', () => {
    expect(getCPUPercent(-0.5)).toBe(0);
  });

  it('clamps to 1', () => {
    expect(getCPUPercent(1.5)).toBe(1);
  });

  it('passes through valid values', () => {
    expect(getCPUPercent(0.42)).toBe(0.42);
  });
});

describe('getRAMPercent', () => {
  it('returns 0 for zero max', () => {
    expect(getRAMPercent(100, 0)).toBe(0);
  });

  it('computes percentage correctly', () => {
    expect(getRAMPercent(750, 1000)).toBe(0.75);
  });

  it('clamps to 1', () => {
    expect(getRAMPercent(2000, 1000)).toBe(1);
  });
});
