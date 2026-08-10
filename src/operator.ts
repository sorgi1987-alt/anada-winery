const DEFAULT_OPERATOR_NAME = 'Elena Martín'

let currentOperatorName: string = DEFAULT_OPERATOR_NAME

export function setCurrentOperatorName(name: string): void {
  const trimmed = name.trim()
  currentOperatorName = trimmed || DEFAULT_OPERATOR_NAME
}

export function getCurrentOperatorName(): string {
  return currentOperatorName
}

export function resetCurrentOperatorName(): void {
  currentOperatorName = DEFAULT_OPERATOR_NAME
}

export function operatorInitials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase()
}
