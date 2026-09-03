export function money(value) {
  const number = Number(value) || 0;
  return `$${number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function moneyDetail(value) {
  const number = Number(value) || 0;
  return number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
