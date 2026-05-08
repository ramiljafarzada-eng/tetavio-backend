import { Injectable } from '@nestjs/common';

export interface WorkScheduleConfig {
  workStartTime: string;
  workEndTime: string;
  breakMinutes: number;
  gracePeriodMin: number;
  workDays: number[];
  saturdayEndTime?: string | null;
}

export interface AttendanceCalcResult {
  workedMinutes: number;
  lateMinutes: number;
  overtimeMinutes: number;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'ON_LEAVE' | 'HOLIDAY';
}

@Injectable()
export class AttendanceEngineService {
  private parseTime(baseDate: Date, timeStr: string): Date {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date(baseDate);
    d.setHours(h, m, 0, 0);
    return d;
  }

  private diffMinutes(a: Date, b: Date): number {
    return Math.round((b.getTime() - a.getTime()) / 60000);
  }

  calculate(
    checkIn: Date | null,
    checkOut: Date | null,
    date: Date,
    schedule: WorkScheduleConfig,
  ): AttendanceCalcResult {
    const dow = date.getDay() === 0 ? 7 : date.getDay();

    if (!schedule.workDays.includes(dow)) {
      return {
        workedMinutes: 0,
        lateMinutes: 0,
        overtimeMinutes: 0,
        status: 'HOLIDAY',
      };
    }

    if (!checkIn) {
      return {
        workedMinutes: 0,
        lateMinutes: 0,
        overtimeMinutes: 0,
        status: 'ABSENT',
      };
    }

    const schedStart = this.parseTime(date, schedule.workStartTime);
    // Use saturdayEndTime for Saturday (dow=6) when defined
    const endTimeStr = (dow === 6 && schedule.saturdayEndTime) ? schedule.saturdayEndTime : schedule.workEndTime;
    const schedEnd = this.parseTime(date, endTimeStr);
    const scheduledWorkMin =
      this.diffMinutes(schedStart, schedEnd) - schedule.breakMinutes;

    const rawLate = this.diffMinutes(schedStart, checkIn);
    const lateMinutes = Math.max(
      0,
      rawLate - schedule.gracePeriodMin,
    );

    const effectiveEnd = checkOut ?? schedEnd;
    const rawWorked = this.diffMinutes(checkIn, effectiveEnd);
    const workedMinutes = Math.max(0, rawWorked - schedule.breakMinutes);

    const overtimeMinutes =
      checkOut && checkOut > schedEnd
        ? this.diffMinutes(schedEnd, checkOut)
        : 0;

    let status: AttendanceCalcResult['status'] = 'PRESENT';
    if (lateMinutes > 0) status = 'LATE';
    if (workedMinutes < scheduledWorkMin / 2) status = 'HALF_DAY';

    return { workedMinutes, lateMinutes, overtimeMinutes, status };
  }

  parseWorkDays(workDays: string): number[] {
    return workDays.split(',').map((d) => parseInt(d.trim(), 10)).filter(Boolean);
  }

  defaultSchedule(): WorkScheduleConfig {
    return {
      workStartTime: '09:00',
      workEndTime: '18:00',
      breakMinutes: 60,
      gracePeriodMin: 10,
      workDays: [1, 2, 3, 4, 5],
    };
  }
}
