import dayjs from 'dayjs';

/**
 * 日期格式化
 * @param date
 * @param template
 */
export function dateFormat(date: number | Date, template = 'YYYY-MM-DD HH:mm:ss'): string {
  return date ? dayjs(date).format(template) : '';
}
