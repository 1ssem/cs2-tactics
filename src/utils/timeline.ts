import { Action, SLOT_COUNT, SLOTS } from '../types'

export function formatSlot(n: number): string {
  return `${n}`
}

export function formatSlotRange(start: number, end: number): string {
  if (start === end) return `第 ${start} 格`
  return `第 ${start}–${end} 格`
}

export function clampSlots(
  startSlot: number,
  endSlot: number,
): { startSlot: number; endSlot: number } {
  let start = Math.max(1, Math.min(SLOT_COUNT, Math.min(startSlot, endSlot)))
  let end = Math.min(SLOT_COUNT, Math.max(startSlot, endSlot))
  if (end < start) end = start
  return { startSlot: start, endSlot: end }
}

export function isInstantAction(action: Action): boolean {
  return action.startSlot === action.endSlot
}

export function slotToIndex(slot: number): number {
  return slot - 1
}

export { SLOTS, SLOT_COUNT }
