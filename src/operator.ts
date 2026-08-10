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
