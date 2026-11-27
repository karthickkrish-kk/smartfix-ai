import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  History,
  List,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type {
  MaintenanceTask,
  TaskPriority,
  TaskRecurrence,
  TaskReminder,
  TaskStatus,
} from '../../types';
import {
  formatDisplayDate,
  getTaskStatus,
  toISODate,
} from '../../utils/calculations';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';

type ViewMode = 'list' | 'calendar' | 'history';

const PRIORITIES: TaskPriority[] = ['High', 'Medium', 'Low'];
const RECURRENCES: TaskRecurrence[] = [
  'None',
  'Monthly',
  'Quarterly',
  'Bi-Annual',
  'Annual',
];
const REMINDERS: TaskReminder[] = [
  'None',
  'Same day',
  '1 day before',
  '3 days before',
  '7 days before',
];

interface TaskFormState {
  taskName: string;
  assetId: string;
  date: string;
  priority: TaskPriority;
  recurrence: TaskRecurrence;
  reminder: TaskReminder;
  notes: string;
  completed: boolean;
}

function emptyTaskForm(prefillAssetId = '', prefillTitle = '', prefillNotes = '', date = ''): TaskFormState {
  return {
    taskName: prefillTitle,
    assetId: prefillAssetId,
    date: date || toISODate(new Date()),
    priority: 'Medium',
    recurrence: 'None',
    reminder: '1 day before',
    notes: prefillNotes,
    completed: false,
  };
}

export function MaintenanceView() {
  const {
    state,
    routeIntent,
    clearRouteIntent,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
  } = useApp();
  const { tasks, assets } = state;

  const assetMap = useMemo(
    () => new Map(assets.map((a) => [a.id, a])),
    [assets]
  );

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | TaskStatus>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | TaskPriority>(
    'All'
  );

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedCalDate, setSelectedCalDate] = useState<string>(() =>
    toISODate(new Date())
  );

  // Form modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TaskFormState>(() => emptyTaskForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<MaintenanceTask | null>(null);

  useEffect(() => {
    if (!routeIntent) return;
    if (
      routeIntent.filterStatus === 'Overdue' ||
      routeIntent.filterStatus === 'Due' ||
      routeIntent.filterStatus === 'Upcoming' ||
      routeIntent.filterStatus === 'Completed'
    ) {
      setViewMode(routeIntent.filterStatus === 'Completed' ? 'history' : 'list');
      setStatusFilter(routeIntent.filterStatus);
    }
    if (routeIntent.openCreate) {
      setEditingId(null);
      setForm(
        emptyTaskForm(
          routeIntent.prefillAssetId ?? '',
          routeIntent.prefillTitle ?? '',
          routeIntent.prefillNotes ?? ''
        )
      );
      setFormErrors({});
      setFormOpen(true);
    }
    clearRouteIntent();
  }, [routeIntent, clearRouteIntent]);

  const enrichedTasks = useMemo(
    () =>
      tasks.map((task) => ({
        task,
        status: getTaskStatus(task),
        assetName: assetMap.get(task.assetId)?.name ?? 'General Home',
      })),
    [tasks, assetMap]
  );

  const activeListTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enrichedTasks
      .filter(({ task, status, assetName }) => {
        if (viewMode === 'history') {
          if (status !== 'Completed') return false;
        } else if (viewMode === 'list') {
          if (statusFilter === 'All') {
            if (status === 'Completed') return false;
          } else if (status !== statusFilter) {
            return false;
          }
        }
        if (priorityFilter !== 'All' && task.priority !== priorityFilter) {
          return false;
        }
        if (q) {
          const hay = `${task.taskName} ${assetName} ${task.notes}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (viewMode === 'history') {
          return (b.task.completedDate || b.task.date).localeCompare(
            a.task.completedDate || a.task.date
          );
        }
        return a.task.date.localeCompare(b.task.date);
      });
  }, [enrichedTasks, viewMode, statusFilter, priorityFilter, search]);

  const counts = useMemo(() => {
    const res = { Overdue: 0, Due: 0, Upcoming: 0, Completed: 0 };
    for (const item of enrichedTasks) {
      res[item.status] += 1;
    }
    return res;
  }, [enrichedTasks]);

  // Calendar grid generation
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: { iso: string | null; day: number | null }[] = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({ iso: null, day: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        iso: toISODate(new Date(year, month, d)),
        day: d,
      });
    }
    return cells;
  }, [calendarMonth]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, typeof enrichedTasks>();
    for (const item of enrichedTasks) {
      const list = map.get(item.task.date) ?? [];
      list.push(item);
      map.set(item.task.date, list);
    }
    return map;
  }, [enrichedTasks]);

  const openCreateModal = (dateOverride?: string) => {
    setEditingId(null);
    setForm(emptyTaskForm('', '', '', dateOverride));
    setFormErrors({});
    setFormOpen(true);
  };

  const openEditModal = (task: MaintenanceTask) => {
    setEditingId(task.id);
    setForm({
      taskName: task.taskName,
      assetId: task.assetId,
      date: task.date,
      priority: task.priority,
      recurrence: task.recurrence,
      reminder: task.reminder,
      notes: task.notes,
      completed: task.completed,
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!form.taskName.trim()) errors.taskName = 'Task name is required.';
    if (!form.date) errors.date = 'Scheduled date is required.';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      taskName: form.taskName.trim(),
      assetId: form.assetId,
      date: form.date,
      priority: form.priority,
      recurrence: form.recurrence,
      reminder: form.reminder,
      notes: form.notes.trim(),
      completed: form.completed,
      completedDate: form.completed ? toISODate(new Date()) : undefined,
    };

    if (editingId) {
      updateTask(editingId, payload);
    } else {
      addTask(payload);
    }
    setFormOpen(false);
  };

  const statusColor = (status: TaskStatus) =>
    status === 'Overdue'
      ? 'text-[#B91C1C]'
      : status === 'Due'
        ? 'text-[#B45309]'
        : status === 'Completed'
          ? 'text-[#15803D]'
          : 'text-[#0D7A7A]';

  const selectedDateTasks = tasksByDate.get(selectedCalDate) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0F1D33] tracking-tight">
            Maintenance Schedule
          </h1>
          <p className="text-sm text-[#64748B] mt-1 tabular-nums">
            <span className="text-[#B91C1C] font-medium">
              {counts.Overdue} overdue
            </span>{' '}
            · {counts.Due} due soon · {counts.Upcoming} upcoming ·{' '}
            {counts.Completed} completed
          </p>
        </div>

        <button
          type="button"
          onClick={() => openCreateModal()}
          className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D7A7A] hover:bg-[#0A6363] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Schedule Task
        </button>
      </div>

      {/* View Switcher + Filters */}
      <div className="bg-white border border-[#E6E3DC] rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Segmented View Tabs */}
        <div
          role="tablist"
          aria-label="Maintenance view mode"
          className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#F3F1EC] self-start"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'list'}
            onClick={() => setViewMode('list')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              viewMode === 'list'
                ? 'bg-white text-[#0F1D33] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F1D33]'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            List
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'calendar'}
            onClick={() => setViewMode('calendar')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              viewMode === 'calendar'
                ? 'bg-white text-[#0F1D33] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F1D33]'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            Calendar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'history'}
            onClick={() => setViewMode('history')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              viewMode === 'history'
                ? 'bg-white text-[#0F1D33] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F1D33]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            History ({counts.Completed})
          </button>
        </div>

        {/* Search & Filters */}
        {viewMode !== 'calendar' && (
          <div className="flex flex-wrap items-center gap-2.5 flex-1 lg:justify-end">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <label htmlFor="maint-search" className="sr-only">
                Search tasks
              </label>
              <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="maint-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks or appliances..."
                className="w-full min-h-[40px] pl-9 pr-3 py-1.5 rounded-xl border border-[#DCD8CF] bg-[#FAF9F6] text-sm text-[#0F1D33] focus:bg-white focus:border-[#0D7A7A] focus:outline-none"
              />
            </div>

            {viewMode === 'list' && (
              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as 'All' | TaskStatus)
                }
                className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#DCD8CF] bg-[#FAF9F6] text-sm text-[#0F1D33] focus:bg-white focus:border-[#0D7A7A] focus:outline-none"
              >
                <option value="All">Active (All)</option>
                <option value="Overdue">Overdue</option>
                <option value="Due">Due Soon</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Completed">Completed</option>
              </select>
            )}

            <select
              aria-label="Filter by priority"
              value={priorityFilter}
              onChange={(e) =>
                setPriorityFilter(e.target.value as 'All' | TaskPriority)
              }
              className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#DCD8CF] bg-[#FAF9F6] text-sm text-[#0F1D33] focus:bg-white focus:border-[#0D7A7A] focus:outline-none"
            >
              <option value="All">All Priorities</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p} Priority
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 bg-white border border-[#E6E3DC] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-bold text-[#0F1D33]">
                {calendarMonth.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </h2>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setCalendarMonth(
                      new Date(
                        calendarMonth.getFullYear(),
                        calendarMonth.getMonth() - 1,
                        1
                      )
                    )
                  }
                  aria-label="Previous month"
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-[#DCD8CF] hover:bg-[#F3F1EC]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                    setSelectedCalDate(toISODate(now));
                  }}
                  className="min-h-[40px] px-3 rounded-xl border border-[#DCD8CF] hover:bg-[#F3F1EC] text-xs font-semibold"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCalendarMonth(
                      new Date(
                        calendarMonth.getFullYear(),
                        calendarMonth.getMonth() + 1,
                        1
                      )
                    )
                  }
                  aria-label="Next month"
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-[#DCD8CF] hover:bg-[#F3F1EC]"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-[#64748B] mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((cell, idx) => {
                if (!cell.iso || cell.day === null) {
                  return <div key={`empty-${idx}`} className="h-14 sm:h-16" />;
                }
                const dayTasks = tasksByDate.get(cell.iso) ?? [];
                const isSelected = cell.iso === selectedCalDate;
                const isToday = cell.iso === toISODate(new Date());
                const hasOverdue = dayTasks.some((t) => t.status === 'Overdue');
                const hasPending = dayTasks.some(
                  (t) => t.status === 'Due' || t.status === 'Upcoming'
                );

                return (
                  <button
                    key={cell.iso}
                    type="button"
                    onClick={() => setSelectedCalDate(cell.iso!)}
                    aria-label={`${formatDisplayDate(cell.iso)}, ${dayTasks.length} task${dayTasks.length === 1 ? '' : 's'}`}
                    className={`h-14 sm:h-16 rounded-xl border p-1.5 flex flex-col items-center justify-between transition-colors ${
                      isSelected
                        ? 'border-[#0D7A7A] bg-[#EEF7F7] text-[#0F1D33]'
                        : isToday
                          ? 'border-[#0F1D33]/40 bg-[#FAF9F6]'
                          : 'border-[#ECE9E2] hover:bg-[#FAF9F6]'
                    }`}
                  >
                    <span
                      className={`text-xs tabular-nums ${
                        isSelected || isToday
                          ? 'font-bold text-[#0F1D33]'
                          : 'text-[#334155]'
                      }`}
                    >
                      {cell.day}
                    </span>
                    {dayTasks.length > 0 && (
                      <span
                        className={`text-[10px] font-mono font-semibold tabular-nums whitespace-nowrap ${
                          hasOverdue
                            ? 'text-[#B91C1C]'
                            : hasPending
                              ? 'text-[#0D7A7A]'
                              : 'text-[#15803D]'
                        }`}
                      >
                        {dayTasks.length}
                        <span className="hidden sm:inline">
                          {' '}
                          {dayTasks.length === 1 ? 'task' : 'tasks'}
                        </span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-4 bg-white border border-[#E6E3DC] rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#ECE9E2]">
                <div>
                  <h3 className="font-display text-sm font-bold text-[#0F1D33]">
                    {formatDisplayDate(selectedCalDate)}
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    {selectedDateTasks.length} scheduled item
                    {selectedDateTasks.length === 1 ? '' : 's'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openCreateModal(selectedCalDate)}
                  className="text-xs font-semibold text-[#0D7A7A] hover:underline whitespace-nowrap"
                >
                  + Add on date
                </button>
              </div>

              {selectedDateTasks.length === 0 ? (
                <p className="text-sm text-[#64748B] py-8 text-center">
                  No tasks scheduled for this date.
                </p>
              ) : (
                <div className="divide-y divide-[#ECE9E2] mt-2">
                  {selectedDateTasks.map(({ task, status, assetName }) => (
                    <div key={task.id} className="py-3 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-xs font-semibold ${statusColor(status)}`}
                        >
                          {status}
                        </span>
                        <span className="text-xs text-[#64748B]">
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-[#0F1D33]">
                        {task.taskName}
                      </p>
                      <p className="text-xs text-[#64748B]">{assetName}</p>
                      <div className="pt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleTaskComplete(task.id)}
                          className="text-xs font-semibold text-[#0D7A7A] hover:underline"
                        >
                          {task.completed ? 'Reopen' : 'Mark Completed'}
                        </button>
                        <span className="text-[#CBD5E1]">·</span>
                        <button
                          type="button"
                          onClick={() => openEditModal(task)}
                          className="text-xs text-[#475569] hover:text-[#0F1D33]"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeListTasks.length === 0 ? (
        <div className="bg-white border border-[#E6E3DC] rounded-2xl p-10 text-center">
          <h2 className="font-display text-base font-bold text-[#0F1D33]">
            {viewMode === 'history'
              ? 'No completed maintenance history yet'
              : 'No matching maintenance tasks'}
          </h2>
          <p className="text-sm text-[#64748B] mt-1">
            {viewMode === 'history'
              ? 'Completed maintenance records will appear here for long-term tracking.'
              : 'Create a recurring preventive task to keep your appliances running smoothly.'}
          </p>
          {viewMode !== 'history' && (
            <button
              type="button"
              onClick={() => openCreateModal()}
              className="mt-4 min-h-[44px] px-4 py-2 rounded-xl bg-[#0D7A7A] text-white text-sm font-semibold hover:bg-[#0A6363]"
            >
              Schedule Task
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-[#E6E3DC] rounded-2xl divide-y divide-[#ECE9E2]">
          {activeListTasks.map(({ task, status, assetName }) => (
            <div
              key={task.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                  <span className={`font-semibold ${statusColor(status)}`}>
                    {status}
                  </span>
                  <span className="text-[#CBD5E1]" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-[#0F1D33] font-medium tabular-nums">
                    {formatDisplayDate(task.date)}
                  </span>
                  <span className="text-[#CBD5E1]" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-[#64748B]">
                    {task.priority} priority
                  </span>
                  {task.recurrence !== 'None' && (
                    <>
                      <span className="text-[#CBD5E1]" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-[#0D7A7A] font-medium">
                        Repeats {task.recurrence}
                      </span>
                    </>
                  )}
                  {task.reminder !== 'None' && !task.completed && (
                    <>
                      <span className="text-[#CBD5E1]" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-[#64748B]">
                        Reminder: {task.reminder}
                      </span>
                    </>
                  )}
                </div>

                <h2 className="font-display text-base font-bold text-[#0F1D33] mt-1">
                  {task.taskName}
                </h2>
                <p className="text-xs text-[#475569] mt-0.5">
                  {assetName}
                  {task.completed && task.completedDate
                    ? ` · Completed ${formatDisplayDate(task.completedDate)}`
                    : ''}
                </p>
                {task.notes && (
                  <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                    {task.notes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleTaskComplete(task.id)}
                  aria-label={
                    task.completed
                      ? `Reopen "${task.taskName}"`
                      : `Mark "${task.taskName}" completed`
                  }
                  className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    task.completed
                      ? 'border border-[#DCD8CF] text-[#334155] hover:bg-[#F3F1EC]'
                      : 'bg-[#EEF7F7] text-[#0D7A7A] hover:bg-[#0D7A7A] hover:text-white'
                  }`}
                >
                  {task.completed ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reopen
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Mark Completed
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => openEditModal(task)}
                  aria-label={`Edit "${task.taskName}"`}
                  className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl text-[#475569] hover:text-[#0F1D33] hover:bg-[#F3F1EC]"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(task)}
                  aria-label={`Delete "${task.taskName}"`}
                  className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl text-[#475569] hover:text-[#B91C1C] hover:bg-[#FEF2F2]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Task Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Edit Maintenance Task' : 'Schedule Maintenance Task'}
        subtitle="Set up one-time or recurring preventive maintenance."
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="min-h-[44px] px-4 py-2 text-sm font-medium text-[#334155] bg-white border border-[#DCD8CF] rounded-xl hover:bg-[#F3F1EC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="task-form"
              className="min-h-[44px] px-5 py-2 text-sm font-semibold text-white bg-[#0D7A7A] hover:bg-[#0A6363] rounded-xl"
            >
              {editingId ? 'Save Changes' : 'Save Task'}
            </button>
          </>
        }
      >
        <form
          id="task-form"
          onSubmit={handleSave}
          noValidate
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="task-name"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Task Name *
              </label>
              <input
                id="task-name"
                type="text"
                value={form.taskName}
                onChange={(e) => setForm({ ...form, taskName: e.target.value })}
                placeholder="e.g. Clean AC filters & check drain line"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
              />
              {formErrors.taskName && (
                <p className="text-xs text-[#B91C1C] mt-1">
                  {formErrors.taskName}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="task-asset"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Appliance / Asset
              </label>
              <select
                id="task-asset"
                value={form.assetId}
                onChange={(e) => setForm({ ...form, assetId: e.target.value })}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] bg-white text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
              >
                <option value="">General Home</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="task-date"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Scheduled Date *
              </label>
              <input
                id="task-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
              />
              {formErrors.date && (
                <p className="text-xs text-[#B91C1C] mt-1">{formErrors.date}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="task-priority"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Priority
              </label>
              <select
                id="task-priority"
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value as TaskPriority })
                }
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] bg-white text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="task-recurrence"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Recurrence
              </label>
              <select
                id="task-recurrence"
                value={form.recurrence}
                onChange={(e) =>
                  setForm({
                    ...form,
                    recurrence: e.target.value as TaskRecurrence,
                  })
                }
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] bg-white text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
              >
                {RECURRENCES.map((r) => (
                  <option key={r} value={r}>
                    {r === 'None' ? 'One-time (No repeat)' : r}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="task-reminder"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Reminder Timing
              </label>
              <select
                id="task-reminder"
                value={form.reminder}
                onChange={(e) =>
                  setForm({
                    ...form,
                    reminder: e.target.value as TaskReminder,
                  })
                }
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DCD8CF] bg-white text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
              >
                {REMINDERS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="task-notes"
                className="block text-xs font-semibold text-[#334155] mb-1.5"
              >
                Checklist & Notes
              </label>
              <textarea
                id="task-notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Supplies required, filter model, step-by-step reminders..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCD8CF] text-sm text-[#0F1D33] focus:border-[#0D7A7A] focus:outline-none"
              />
            </div>

            {editingId && (
              <div className="sm:col-span-2">
                <label className="inline-flex items-center gap-2.5 text-sm text-[#0F1D33] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.completed}
                    onChange={(e) =>
                      setForm({ ...form, completed: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#0D7A7A]"
                  />
                  Mark task as completed
                </label>
              </div>
            )}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteTask(deleteTarget.id);
        }}
        title="Delete Maintenance Task"
        message={`Delete "${deleteTarget?.taskName}"? This cannot be undone.`}
        confirmLabel="Delete Task"
      />
    </div>
  );
}
