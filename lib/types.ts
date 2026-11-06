export type StudyModule = {
  id: number
  categoryId: string | null
  title: string
  description: string
  fileUrl: string | null
  fileName: string | null
  createdAt: string
}

export type StudyModuleFile = {
  id: number
  categoryId: string | null
  title: string
  fileName: string | null
  fileUrl: string | null
}

export type StudyQuestionnaireQuestion = {
  id: string
  questionnaireId: string
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
  position: number
  createdAt: string
}

export type StudyQuestionnaire = {
  id: string
  categoryId: string
  title: string
  description: string | null
  questionCount: number
  questions: StudyQuestionnaireQuestion[]
  createdAt: string
  updatedAt: string
}

export type StudyCategory = {
  id: string
  title: string
  description: string | null
  modules: StudyModule[]
  questions: CategoryQuestion[]
  questionnaires: StudyQuestionnaire[]
  createdAt: string
  updatedAt: string
}

export type CategoryQuestion = {
  id: string
  categoryId: string
  question: string
  options: string[]
  correctAnswer: string
  position: number
  createdAt: string
}

export type AdminUser = {
  id: number
  name: string
  email: string
  role: string
  createdAt: string
}

export type ModuleFormState = {
  status: 'idle' | 'success' | 'error'
  message: string
}

export type CategoryFormState = {
  status: 'idle' | 'success' | 'error'
  message: string
}

export type QuestionFormState = {
  status: 'idle' | 'success' | 'error'
  message: string
}
