export interface SimulationParams {
  startingAmount: number;
  contributionAmount: number;
  contributionFrequency: 'weekly' | 'monthly' | 'every-x-months' | 'yearly';
  contributionEveryX: number;
  interestRate: number;
  interestRateType: 'monthly' | 'yearly';
  years: number;
}

export interface MonthRow {
  month: number;
  yearNum: number;
  monthInYear: number;
  period: string;
  startBalance: number;
  contributions: number;
  interestEarned: number;
  endBalance: number;
  totalContributed: number;
  totalInterest: number;
}

export interface YearRow {
  yearNum: number;
  period: string;
  startBalance: number;
  contributions: number;
  interestEarned: number;
  endBalance: number;
  totalContributed: number;
  totalInterest: number;
}

export interface SimulationResult {
  monthRows: MonthRow[];
  yearRows: YearRow[];
  finalBalance: number;
  totalContributed: number;
  totalInterest: number;
  totalReturnPct: number;
  params: SimulationParams;
}

export function simulateInvestment(params: SimulationParams): SimulationResult {
  const {
    startingAmount,
    contributionAmount,
    contributionFrequency,
    contributionEveryX,
    interestRate,
    interestRateType,
    years,
  } = params;

  const safeYears = Math.max(1, Math.min(100, Math.floor(years) || 1));
  const safeRate = Math.max(0, interestRate);

  const monthlyRate =
    interestRateType === 'yearly'
      ? Math.pow(1 + safeRate / 100, 1 / 12) - 1
      : safeRate / 100;

  const totalMonths = safeYears * 12;
  const monthRows: MonthRow[] = [];

  let balance = Math.max(0, startingAmount);
  let runningContributed = 0;
  let runningInterest = 0;

  for (let m = 1; m <= totalMonths; m++) {
    const startBalance = balance;
    const yearNum = Math.ceil(m / 12);
    const monthInYear = ((m - 1) % 12) + 1;

    let contributions = 0;
    const safeX = Math.max(1, Math.floor(contributionEveryX) || 1);

    switch (contributionFrequency) {
      case 'weekly':
        contributions = contributionAmount * (52 / 12);
        break;
      case 'monthly':
        contributions = contributionAmount;
        break;
      case 'every-x-months':
        contributions = m % safeX === 0 ? contributionAmount : 0;
        break;
      case 'yearly':
        contributions = monthInYear === 1 ? contributionAmount : 0;
        break;
    }
    contributions = Math.max(0, contributions);

    const interestEarned = startBalance * monthlyRate;
    balance = startBalance + interestEarned + contributions;

    runningContributed += contributions;
    runningInterest += interestEarned;

    monthRows.push({
      month: m,
      yearNum,
      monthInYear,
      period: `Y${yearNum} M${String(monthInYear).padStart(2, '0')}`,
      startBalance,
      contributions,
      interestEarned,
      endBalance: balance,
      totalContributed: runningContributed,
      totalInterest: runningInterest,
    });
  }

  const yearRows: YearRow[] = [];
  for (let y = 1; y <= safeYears; y++) {
    const months = monthRows.filter(r => r.yearNum === y);
    const first = months[0];
    const last = months[months.length - 1];
    yearRows.push({
      yearNum: y,
      period: `Year ${y}`,
      startBalance: first.startBalance,
      contributions: months.reduce((s, r) => s + r.contributions, 0),
      interestEarned: months.reduce((s, r) => s + r.interestEarned, 0),
      endBalance: last.endBalance,
      totalContributed: last.totalContributed,
      totalInterest: last.totalInterest,
    });
  }

  const totalInvested = startingAmount + runningContributed;
  const totalReturnPct =
    totalInvested > 0 ? (runningInterest / totalInvested) * 100 : 0;

  return {
    monthRows,
    yearRows,
    finalBalance: balance,
    totalContributed: runningContributed,
    totalInterest: runningInterest,
    totalReturnPct,
    params,
  };
}
