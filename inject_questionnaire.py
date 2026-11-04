import re

with open('components/admin/category-manager.tsx', 'r') as f:
    content = f.read()

marker = '          {/* Category summary */}'
idx = content.find(marker)
if idx == -1:
    print('Marker not found')
else:
    questionnaire_form = '''          {/* Add Questionnaire */}
          {showQuestionnaireForm && (
            <div className="mt-4 pt-4 border-t border-[#edf0ef] space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#142238]">Add questionnaire to "{category.title}"</h4>
                <p className="mt-1 text-xs text-[#607477]">A questionnaire is a timed quiz with multiple questions.</p>
              </div>
              <form ref={questionnaireFormRef} action={questionnaireAction} className="space-y-3">
                <input type="hidden" name="categoryId" value={category.id} />
                <div>
                  <label className="text-xs font-bold text-[#314957] block">Questionnaire title</label>
                  <input
                    name="title"
                    type="text"
                    required
                    placeholder="e.g. Road Signs Quiz"
                    className="w-full rounded-lg border border-[#cbd9d7] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#314957] block">Description</label>
                  <textarea
                    name="description"
                    rows={2}
                    placeholder="What does this questionnaire cover?"
                    className="w-full rounded-lg border border-[#cbd9d7] px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold text-[#314957] block">Time limit (minutes)</label>
                    <input
                      name="timeLimit"
                      type="number"
                      min="1"
                      max="600"
                      placeholder="e.g. 30"
                      className="w-full rounded-lg border border-[#cbd9d7] px-3 py-2 text-sm"
                    />
                    <p className="mt-1 text-xs text-[#718181]">Optional. Leave blank for no time limit.</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#314957] block">Pass mark (%)</label>
                    <input
                      name="passMark"
                      type="number"
                      min="1"
                      max="100"
                      value="70"
                      className="w-full rounded-lg border border-[#cbd9d7] px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                {questionnaireState.status !== 'idle' && (
                  <p role="status" className={`flex items-start gap-2 rounded-lg p-2 text-xs font-semibold ${questionnaireState.status === 'success' ? 'bg-[#e6f5f3] text-[#06625e]' : 'bg-[#fdeeee] text-[#b33636]'}`}>
                    {questionnaireState.message}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={questionnairePending}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#087f78] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                >
                  <List className="size-3.5" />
                  {questionnairePending ? 'Creating…' : 'Add questionnaire'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuestionnaireForm(false)}
                  className="mt-2 w-full rounded-lg border border-[#cbd9d7] px-4 py-2 text-sm font-bold text-[#607477]"
                >
                  Cancel
                </button>
              </form>
            </div>
          )}
          {!showQuestionnaireForm && (
            <button
              onClick={() => setShowQuestionnaireForm(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#d8e2e0] bg-white px-4 py-2 text-sm font-bold text-[#087f78] hover:bg-[#effafa]"
            >
              <List className="size-3.5" /> Add questionnaire
            </button>
          )}

          {/* Existing questionnaires */}
          {category.questionnaires.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#edf0ef]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="grid size-10 place-items-center rounded-lg bg-[#fff3d6] text-[#9a6a05]">
                      <List className="size-5" />
                    </span>
                    <h4 className="text-sm font-bold text-[#142238]">Questionnaires</h4>
                  </div>
                  <p className="text-xs font-semibold text-[#8aa5a1]">
                    {category.questionnaires.length} questionnaire{category.questionnaires.length === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
              <div className="mt-3 space-y-3">
                {category.questionnaires.map((q) => (
                  <div key={q.id} className="flex items-start justify-between gap-3 rounded-lg border border-[#e3e8e6] bg-[#f8fbfa] p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-extrabold text-[#142238] truncate">{q.title}</p>
                        <span className="rounded-full bg-[#e6f5f3] px-2 py-0.5 text-[10px] font-bold text-[#087f78]">
                          {q.questionCount} question{q.questionCount === 1 ? '' : 's'}
                        </span>
                      </div>
                      {q.description && (
                        <p className="mt-1 text-xs text-[#607477] truncate">{q.description}</p>
                      )}
                      <p className="mt-1 text-xs text-[#8aa5a1]">
                        {q.timeLimitMin ? `${q.timeLimitMin} min time limit · ` : ''}Pass mark: {q.passMark}%
                      </p>
                    </div>
                    <form
                      onSubmit={(e) => {
                        if (!window.confirm(`Delete questionnaire "${q.title}"? This cannot be undone.`)) {
                          e.preventDefault()
                        }
                      }}
                      action={deleteQuestionnaireAction}
                      className="ml-2"
                    >
                      <input type="hidden" name="id" value={q.id} />
                      <button type="submit" className="rounded-lg border border-[#e7c9c9] p-1.5 text-[#b33636] hover:bg-[#fdeeee]">
                        <Trash2 className="size-3.5" />
                      </button>
                    </form>
                  </div>
                  {/* Add questions to questionnaire */}
                  <div className="mt-3 pt-3 border-t border-[#edf0ef]">
                    <div className="flex items-center gap-2">
                      <span className="grid size-9 place-items-center rounded-lg bg-[#e6f5f3] text-[#087f78]">
                        <ShieldCheck className="size-4" />
                      </span>
                      <h5 className="text-xs font-bold text-[#142238]">Add question to "{q.title}"</h5>
                    </div>
                  </div>
                  <form ref={questionnaireQuestionFormRef} action={questionnaireQuestionAction} className="mt-2 space-y-3">
                    <input type="hidden" name="questionnaireId" value={q.id} />
                    <div>
                      <label className="text-xs font-bold text-[#314957] block">Question</label>
                      <input
                        name="question"
                        type="text"
                        required
                        placeholder="e.g. What does a red triangular sign mean?"
                        className="w-full rounded-lg border border-[#cbd9d7] px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="text-xs font-bold text-[#314957] block">Option A</label>
                        <input name="optionA" type="text" required className="w-full rounded-lg border border-[#cbd9d7] px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#314957] block">Option B</label>
                        <input name="optionB" type="text" required className="w-full rounded-lg border border-[#cbd9d7] px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#314957] block">Option C</label>
                        <input name="optionC" type="text" required className="w-full rounded-lg border border-[#cbd9d7] px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#314957] block">Option D</label>
                        <input name="optionD" type="text" required className="w-full rounded-lg border border-[#cbd9d7] px-3 py-2 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#314957] block">Correct answer</label>
                      <select name="correctAnswer" required className="mt-1 w-full rounded-lg border border-[#cbd9d7] px-3 py-2 text-sm">
                        <option value="">Select correct option</option>
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C">Option C</option>
                        <option value="D">Option D</option>
                      </select>
                      <p className="mt-1 text-xs text-[#718181]">The correct answer text must match one of the options above.</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#314957] block">Explanation (optional)</label>
                      <textarea
                        name="explanation"
                        rows={2}
                        placeholder="Explain why this answer is correct"
                        className="w-full rounded-lg border border-[#cbd9d7] px-3 py-2 text-sm"
                      />
                    </div>
                    {questionnaireQuestionState.status !== 'idle' && (
                      <p role="status" className={`flex items-start gap-2 rounded-lg p-2 text-xs font-semibold ${questionnaireQuestionState.status === 'success' ? 'bg-[#e6f5f3] text-[#06625e]' : 'bg-[#fdeeee] text-[#b33636]'}`}>
                        {questionnaireQuestionState.message}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={questionnaireQuestionPending}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#087f78] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                    >
                      <ShieldCheck className="size-3.5" />
                      {questionnaireQuestionPending ? 'Adding…' : 'Add question'}
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}

          {/* Category summary */}
'''

    content = content[:idx] + questionnaire_form + content[idx:]
    
    with open('components/admin/category-manager.tsx', 'w') as f:
        f.write(content)
    print('Done')
