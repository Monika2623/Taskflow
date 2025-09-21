import React, { useEffect, useMemo, useState } from 'react'
import { api, Task, Activity } from '../api/client'
import { FiBarChart2, FiCheckCircle, FiPlay, FiAlertTriangle, FiUser } from 'react-icons/fi'

const statCardsStatic = [
  {
    label: 'Total Tasks',
    value: 3,
    subtitle: 'Assigned to you',
    icon: <FiBarChart2 className="text-gray-400" size={22} />,
  },
  {
    label: 'Completed',
    value: 1,
    subtitle: 'Tasks finished',
    icon: <FiCheckCircle className="text-gray-400" size={22} />,
  },
  {
    label: 'In Progress',
    value: 1,
    subtitle: 'Currently working on',
    icon: <FiPlay className="text-gray-400" size={22} />,
  },
  {
    label: 'To Do',
    value: 1,
    subtitle: 'Waiting to start',
    icon: <FiAlertTriangle className="text-gray-400" size={22} />,
  },
]

const tasksStatic = [
  {
    title: 'Implement authentication',
    project: 'TaskFlow MVP',
    due: 'Due 18/1/2024',
    priority: 'High',
    status: 'In Progress',
  },
  {
    title: 'Review pull request #45',
    project: 'TaskFlow MVP',
    due: 'Due 20/1/2024',
    priority: 'Medium',
    status: 'To Do',
  },
  {
    title: 'Update documentation',
    project: 'TaskFlow MVP',
    due: 'Due 15/1/2024',
    priority: 'Low',
    status: 'Done',
  },
]

const activitiesStatic = [
  { type: 'Completed', task: 'Complete project setup', time: '2 hours ago' },
  { type: 'Updated', task: 'Implement authentication', time: '4 hours ago' },
  { type: 'Created', task: 'API integration testing', time: '1 day ago' },
]

const badgeColors = {
  High: 'bg-red-600 text-white',
  Medium: 'bg-black text-white',
  Low: 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-100',
  'In Progress': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  'To Do': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  Done: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
}

const YourWork: React.FC = () => {
  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [activities, setActivities] = useState<Activity[] | null>(null)
  const [query, setQuery] = useState<string>('')
  // Pagination toggles for tasks and activities
  const [showAllTasks, setShowAllTasks] = useState(false)
  const [showAllActivities, setShowAllActivities] = useState(false)

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') || '' : ''

  const fetchData = async () => {
    if (!token) return
    try {
      const [t, a] = await Promise.all([api.tasks(token), api.activities(token)])
      setTasks(t)
      setActivities(a)
    } catch (e) {
      console.error('Failed to load dashboard data', e)
    }
  }

  useEffect(() => {
    let mounted = true
    if (!token) return
    fetchData()
    const handler = () => fetchData()
    window.addEventListener('recent:refresh', handler)
    return () => {
      mounted = false
      window.removeEventListener('recent:refresh', handler)
    }
  }, [token])

  // Listen to global search coming from Navbar
  useEffect(() => {
    const onSearch = (e: Event) => {
      const ce = e as CustomEvent<{ query?: string }>
      setQuery(String(ce.detail?.query ?? ''))
    }
    window.addEventListener('app:search', onSearch as EventListener)
    return () => window.removeEventListener('app:search', onSearch as EventListener)
  }, [])

  const computedStats = useMemo(() => {
    if (!tasks) return statCardsStatic
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'done').length
    const inProgress = tasks.filter(t => t.status === 'in_progress').length
    const todo = tasks.filter(t => t.status === 'todo').length
    return [
      { ...statCardsStatic[0], value: total },
      { ...statCardsStatic[1], value: completed },
      { ...statCardsStatic[2], value: inProgress },
      { ...statCardsStatic[3], value: todo },
    ]
  }, [tasks])

  // Compute filtered tasks based on query (case-insensitive)
  const filteredTasks = (tasks || tasksStatic).filter((task: any) => {
    if (!query) return true
    const q = query.toLowerCase()
    const title: string = (task?.title || '').toString()
    let projectLabel: string = ''
    if (typeof task?.project === 'string') projectLabel = task.project
    else if (typeof task?.project === 'number') projectLabel = `Project #${task.project}`
    else if (task?.project && typeof task.project === 'object') projectLabel = task.project.name || String(task.project.id || '')
    const priority: string = (task?.priority || '').toString()
    const statusApi: string = (task?.status || '').toString()
    const statusLabel: string =
      statusApi === 'in_progress' ? 'In Progress' :
      statusApi === 'todo' ? 'To Do' :
      statusApi === 'done' ? 'Done' : statusApi
    const haystack = [title, projectLabel, priority, statusLabel].join(' ').toLowerCase()
    return haystack.includes(q)
  })

  // For showing limited items based on toggle (5 initially, 10 max)
  const displayedTasks = showAllTasks ? filteredTasks.slice(0, 10) : filteredTasks.slice(0, 5)
  const displayedActivities = showAllActivities ? (activities || activitiesStatic).slice(0, 10) : (activities || activitiesStatic).slice(0, 5)

  return (
    <div className="p-8 bg-background text-foreground min-h-screen">
      <h2 className="text-2xl font-bold mb-1">Your Work</h2>
      <p className="mb-8 text-gray-600 dark:text-gray-300">Overview of your assigned tasks and recent activity</p>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-7">
        {computedStats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-5 flex flex-col justify-between min-w-[180px]"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-gray-600 dark:text-gray-300">{stat.label}</span>
              {stat.icon}
            </div>
            <div className="text-3xl font-bold">{stat.value}</div>
            <div className="text-xs text-gray-400 dark:text-gray-300 mt-1">{stat.subtitle}</div>
          </div>
        ))}
      </div>

      {/* Main 2-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
        {/* Left: Tasks */}
        <section className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5 flex flex-col border border-gray-200 dark:border-gray-800">
          <h3 className="font-medium text-lg mb-4">Tasks</h3>
          <ul className="space-y-3 mb-3">
            {displayedTasks.map((task: any) => {
              const title: string = task?.title || "Untitled"
              let projectLabel: string = "-"
              if (typeof task?.project === "string") projectLabel = task.project
              else if (typeof task?.project === "number") projectLabel = `Project #${task.project}`
              else if (task?.project && typeof task.project === "object") projectLabel = task.project.name || String(task.project.id || "-")

              const dueRaw = task?.due ?? task?.due_date ?? task?.start_date // fallback if needed
              const dueLabel = dueRaw ? `Due ${new Date(dueRaw).toLocaleDateString()}` : "-"

              const priority: string = task?.priority || "Medium"
              const statusApi: string = task?.status || "todo"
              const statusLabel: string =
                statusApi === "in_progress" ? "In Progress" :
                statusApi === "todo" ? "To Do" :
                statusApi === "done" ? "Done" : statusApi

              return (
                <li
                  key={task?.id ?? title}
                  className="flex justify-between items-center bg-gray-50 dark:bg-gray-900 px-4 py-3 rounded-lg border border-gray-100 dark:border-gray-800"
                >
                  <div>
                    <div className="font-medium">{title}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">{projectLabel} <span className="mx-1">•</span> {dueLabel}</div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${badgeColors[priority as keyof typeof badgeColors] || "bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-100"}`}>
                      {priority}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold border border-transparent ${badgeColors[statusLabel as keyof typeof badgeColors] || "text-gray-600 dark:text-gray-300"}`}>
                      {statusLabel}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
          {filteredTasks.length > 5 && (
            <button
              onClick={() => setShowAllTasks(!showAllTasks)}
              className="w-full mt-2 py-2 rounded border border-gray-300 dark:border-gray-700 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800/60"
            >
              {showAllTasks ? 'Show Less Tasks' : 'View All Tasks'}
            </button>
          )}
        </section>

        {/* Right: Recent Activity */}
        <section className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-5 flex flex-col border border-gray-200 dark:border-gray-800">
          <h3 className="font-medium text-lg mb-4">Recent Activity</h3>
          <ul className="space-y-3 mb-3">
            {displayedActivities.map((activity: any, i: number) => {
              let taskLabel: string = ""
              if (typeof activity?.task === "string") taskLabel = activity.task
              else if (activity?.task && typeof activity.task === "object") taskLabel = activity.task.title || `#${activity.task.id}`
              else taskLabel = "task"

              const timeLabel: string = activity?.created_at || activity?.time || ""
              const verb: string = activity?.type ? String(activity.type).replace(/_/g, " ") : "Activity"

              return (
                <li key={i} className="flex items-center gap-3">
                  <span className="bg-gray-200 dark:bg-gray-800 w-8 h-8 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-200">
                    <FiUser size={18} />
                  </span>
                  <div>
                    <span className="block text-sm">
                      <span className="font-semibold">{verb}:</span> "{taskLabel}"
                    </span>
                    <span className="text-xs text-gray-400">{timeLabel}</span>
                  </div>
                </li>
              )
            })}
          </ul>
          {(activities || activitiesStatic).length > 5 && (
            <button
              onClick={() => setShowAllActivities(!showAllActivities)}
              className="w-full mt-2 py-2 rounded border border-gray-300 dark:border-gray-700 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800/60"
            >
              {showAllActivities ? 'Show Less Activity' : 'View All Activity'}
            </button>
          )}
        </section>
      </div>
    </div>
  )
}

export default YourWork
