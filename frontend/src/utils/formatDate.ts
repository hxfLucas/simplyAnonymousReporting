export function formatDate(dateInput: string | number | Date | undefined | null): string {
  if (!dateInput) return '';
  const d = new Date(dateInput as any);
  if (Number.isNaN(d.getTime())) return '';
  const day = d.getDate();
  const getOrdinal = (n: number) => {
    if (n > 3 && n < 21) return 'th';
    switch (n % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };
  const month = d.toLocaleDateString(undefined, { month: 'long' });
  const year = d.getFullYear();
  return `${day}${getOrdinal(day)}, ${month} ${year}`;
}

export default formatDate;
