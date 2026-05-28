const STORAGE_KEY = 'manager_local_employees'

export interface LocalEmployee {
  id: string
  name: string
  roll_no: string
  mobile_number: string
  assigned_class: string
  total_score: number
  created_at: string
  isLocal: boolean
}

export function getLocalEmployees(): LocalEmployee[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function addLocalEmployee(emp: {
  name: string
  roll_no: string
  mobile_number: string
  assigned_class: string
}): LocalEmployee {
  const employees = getLocalEmployees()
  const newEmp: LocalEmployee = {
    ...emp,
    id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    total_score: 0,
    created_at: new Date().toISOString(),
    isLocal: true,
  }
  employees.push(newEmp)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(employees))
  return newEmp
}

export function updateLocalEmployee(id: string, updates: { name?: string; assigned_class?: string }): boolean {
  const employees = getLocalEmployees()
  const idx = employees.findIndex(e => e.id === id)
  if (idx === -1) return false
  if (updates.name !== undefined) employees[idx].name = updates.name
  if (updates.assigned_class !== undefined) employees[idx].assigned_class = updates.assigned_class
  localStorage.setItem(STORAGE_KEY, JSON.stringify(employees))
  return true
}

export function removeLocalEmployee(id: string): boolean {
  const employees = getLocalEmployees()
  const filtered = employees.filter(e => e.id !== id)
  if (filtered.length === employees.length) return false
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  return true
}
