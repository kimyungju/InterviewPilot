"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader,
  Plus,
  Sparkles,
  FileText,
  ArrowLeft,
  Users,
  Code,
  Boxes,
  Zap,
  Upload,
  X,
} from "lucide-react";
import { createInterview, suggestQuestions } from "@/app/actions/interview";
import { extractTextFromPdf } from "@/app/actions/pdf";
import { useTranslation } from "@/lib/i18n/LanguageContext";

type Step = "choose" | "form" | "questions" | "resume";
type Mode = "auto" | "content";
type InterviewType = "general" | "behavioral" | "technical" | "system-design";
type Difficulty = "junior" | "mid" | "senior";
type QuestionCount = "3" | "5" | "10";

const interviewTypeIcons: Record<InterviewType, React.ReactNode> = {
  general: <Zap className="h-4 w-4" />,
  behavioral: <Users className="h-4 w-4" />,
  technical: <Code className="h-4 w-4" />,
  "system-design": <Boxes className="h-4 w-4" />,
};

const interviewTypeValues: InterviewType[] = ["general", "behavioral", "technical", "system-design"];
const difficultyValues: Difficulty[] = ["junior", "mid", "senior"];
const questionCounts: QuestionCount[] = ["3", "5", "10"];

export default function AddNewInterview() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("choose");
  const [mode, setMode] = useState<Mode>("auto");
  const [jobPosition, setJobPosition] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobExperience, setJobExperience] = useState("");
  const [referenceContent, setReferenceContent] = useState("");
  const [interviewType, setInterviewType] = useState<InterviewType>("general");
  const [difficulty, setDifficulty] = useState<Difficulty>("mid");
  const [questionCount, setQuestionCount] = useState<QuestionCount>("5");
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);

  // Questions step state
  const [suggestedQs, setSuggestedQs] = useState<string[]>([]);
  const [selectedQs, setSelectedQs] = useState<Set<number>>(new Set());
  const [customQs, setCustomQs] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // PDF upload state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const router = useRouter();
  const { t, language } = useTranslation();

  const resetState = () => {
    setStep("choose");
    setMode("auto");
    setJobPosition("");
    setJobDesc("");
    setJobExperience("");
    setReferenceContent("");
    setInterviewType("general");
    setDifficulty("mid");
    setQuestionCount("5");
    setResumeText("");
    setLoading(false);
    setPdfFile(null);
    setExtracting(false);
    setExtractError("");
    setDragOver(false);
    setSuggestedQs([]);
    setSelectedQs(new Set());
    setCustomQs([]);
    setCustomInput("");
    setLoadingSuggestions(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) resetState();
  };

  const handleModeSelect = (selectedMode: Mode) => {
    setMode(selectedMode);
    setStep("form");
  };

  const handlePdfUpload = useCallback(
    async (file: File) => {
      setPdfFile(file);
      setExtractError("");
      setExtracting(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const { text } = await extractTextFromPdf(formData);
        if (mode === "auto") {
          setResumeText(text);
        } else {
          setReferenceContent(text);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to extract text.";
        setExtractError(message);
        setPdfFile(null);
      } finally {
        setExtracting(false);
      }
    },
    [mode]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handlePdfUpload(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handlePdfUpload(file);
  };

  const clearPdf = () => {
    setPdfFile(null);
    setExtractError("");
    if (mode === "auto") {
      setResumeText("");
    } else {
      setReferenceContent("");
    }
  };

  const loadQuestionSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const { questions } = await suggestQuestions(
        jobPosition,
        mode === "auto" ? jobDesc : "",
        mode === "auto" ? jobExperience : "",
        {
          referenceContent: mode === "content" ? referenceContent : undefined,
          interviewType,
          difficulty,
          questionCount,
          language,
        }
      );
      setSuggestedQs(questions);
      setSelectedQs(new Set(questions.map((_, i) => i)));
    } catch (error) {
      console.error("Failed to load suggestions:", error);
      setSuggestedQs([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const toggleSuggestion = (index: number) => {
    setSelectedQs((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const addCustomQuestion = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    setCustomQs((prev) => [...prev, trimmed]);
    setCustomInput("");
  };

  const removeCustomQuestion = (index: number) => {
    setCustomQs((prev) => prev.filter((_, i) => i !== index));
  };

  const getFinalQuestions = (): string[] => {
    const selected = suggestedQs.filter((_, i) => selectedQs.has(i));
    return [...selected, ...customQs];
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    setLoading(true);
    try {
      const finalQuestions = getFinalQuestions();
      const { mockId } = await createInterview(
        jobPosition,
        mode === "auto" ? jobDesc : "",
        mode === "auto" ? jobExperience : "",
        {
          referenceContent: mode === "content" ? referenceContent : undefined,
          interviewType,
          difficulty,
          resumeText: resumeText || undefined,
          questionCount,
          language,
          customQuestions: finalQuestions.length > 0 ? finalQuestions : undefined,
        }
      );
      handleOpenChange(false);
      router.push(`/dashboard/interview/${mockId}`);
    } catch (error) {
      console.error("Failed to create interview:", error);
    } finally {
      setLoading(false);
    }
  };

  const pdfUploadZone = (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40 bg-accent/30 hover:bg-accent/50"
        }`}
      >
        {extracting ? (
          <>
            <Loader className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">{t("create.extracting")}</p>
          </>
        ) : pdfFile ? (
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{pdfFile.name}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearPdf();
              }}
              className="p-0.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              {t("create.dropPdf")}
            </p>
            <p className="text-xs text-muted-foreground">{t("create.pdfOnly")}</p>
          </>
        )}
      </div>
      {extractError && (
        <p className="text-sm text-destructive">{extractError}</p>
      )}
    </div>
  );

  const orDivider = (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 border-t border-border" />
      <span className="text-xs text-muted-foreground">{t("create.or")}</span>
      <div className="flex-1 border-t border-border" />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <div className="group flex flex-col items-center justify-center gap-3 p-10 rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-accent/30 hover:bg-accent/60 cursor-pointer transition-all duration-300">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <span className="font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300">
            {t("create.newInterview")}
          </span>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        {step === "choose" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-display">
                {t("create.title")}
              </DialogTitle>
              <DialogDescription>
                {t("create.description")}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <button
                onClick={() => handleModeSelect("auto")}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary/40 bg-accent/30 hover:bg-accent/60 cursor-pointer transition-all duration-300 text-center"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{t("create.autoGenerate")}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("create.autoGenerateDesc")}
                  </p>
                </div>
              </button>
              <button
                onClick={() => handleModeSelect("content")}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border hover:border-primary/40 bg-accent/30 hover:bg-accent/60 cursor-pointer transition-all duration-300 text-center"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{t("create.fromContent")}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("create.fromContentDesc")}
                  </p>
                </div>
              </button>
            </div>
          </>
        )}

        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-display">
                {mode === "auto"
                  ? t("create.formTitleAuto")
                  : t("create.formTitleContent")}
              </DialogTitle>
              <DialogDescription>
                {mode === "auto"
                  ? t("create.formDescAuto")
                  : t("create.formDescContent")}
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStep("questions");
                loadQuestionSuggestions();
              }}
              className="space-y-5 mt-4"
            >
              <div>
                <label
                  htmlFor="jobPosition"
                  className="block text-sm font-medium mb-1.5"
                >
                  {t("create.jobPosition")}
                </label>
                <Input
                  id="jobPosition"
                  placeholder={t("create.jobPositionPlaceholder")}
                  required
                  value={jobPosition}
                  onChange={(e) => setJobPosition(e.target.value)}
                />
              </div>
              {mode === "auto" ? (
                <>
                  <div>
                    <label
                      htmlFor="jobDesc"
                      className="block text-sm font-medium mb-1.5"
                    >
                      {t("create.jobDesc")}
                    </label>
                    <Textarea
                      id="jobDesc"
                      placeholder={t("create.jobDescPlaceholder")}
                      required
                      value={jobDesc}
                      onChange={(e) => setJobDesc(e.target.value)}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="jobExperience"
                      className="block text-sm font-medium mb-1.5"
                    >
                      {t("create.yearsOfExp")}
                    </label>
                    <Input
                      id="jobExperience"
                      type="number"
                      placeholder={t("create.yearsOfExpPlaceholder")}
                      required
                      min={0}
                      max={50}
                      value={jobExperience}
                      onChange={(e) => setJobExperience(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <label className="block text-sm font-medium mb-1.5">
                    {t("create.referenceMaterial")}
                  </label>
                  {pdfUploadZone}
                  {orDivider}
                  <Textarea
                    id="referenceContent"
                    placeholder={t("create.pasteReference")}
                    required={!referenceContent}
                    rows={8}
                    value={referenceContent}
                    onChange={(e) => setReferenceContent(e.target.value)}
                  />
                </div>
              )}

              {/* Interview Type */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("create.interviewType")}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {interviewTypeValues.map((tv) => (
                    <button
                      key={tv}
                      type="button"
                      onClick={() => setInterviewType(tv)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                        interviewType === tv
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:border-primary/30 text-muted-foreground"
                      }`}
                    >
                      {interviewTypeIcons[tv]}
                      <span className="text-xs font-medium">{t(`types.${tv}`)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty + Question Count row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("create.difficulty")}
                  </label>
                  <div className="flex rounded-lg border-2 border-border overflow-hidden">
                    {difficultyValues.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 py-2 text-xs font-medium transition-all duration-200 ${
                          difficulty === d
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent text-muted-foreground"
                        }`}
                      >
                        {t(`difficulties.${d}`)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("create.questions")}
                  </label>
                  <div className="flex rounded-lg border-2 border-border overflow-hidden">
                    {questionCounts.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setQuestionCount(c)}
                        className={`flex-1 py-2 text-xs font-medium transition-all duration-200 ${
                          questionCount === c
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent text-muted-foreground"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-between pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep("choose")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> {t("create.back")}
                </Button>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleOpenChange(false)}
                  >
                    {t("create.cancel")}
                  </Button>
                  <Button type="submit">{t("create.next")}</Button>
                </div>
              </div>
            </form>
          </>
        )}

        {step === "questions" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-display">
                {t("create.questionsTitle")}
              </DialogTitle>
              <DialogDescription>
                {t("create.questionsDesc")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 mt-4">
              {/* AI Suggestions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">{t("create.aiSuggestions")}</label>
                  {suggestedQs.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        selectedQs.size === suggestedQs.length
                          ? setSelectedQs(new Set())
                          : setSelectedQs(new Set(suggestedQs.map((_, i) => i)))
                      }
                      className="text-xs text-primary hover:underline"
                    >
                      {selectedQs.size === suggestedQs.length
                        ? t("create.deselectAll")
                        : t("create.selectAll")}
                    </button>
                  )}
                </div>

                {loadingSuggestions ? (
                  <div className="flex flex-col items-center gap-3 p-8 rounded-xl border-2 border-dashed border-border bg-accent/30">
                    <Loader className="h-6 w-6 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">{t("create.generatingSuggestions")}</p>
                  </div>
                ) : suggestedQs.length > 0 ? (
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    {suggestedQs.map((q, i) => (
                      <label
                        key={i}
                        className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedQs.has(i)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedQs.has(i)}
                          onChange={() => toggleSuggestion(i)}
                          className="mt-0.5 h-4 w-4 rounded"
                        />
                        <span className="text-sm">{q}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center p-4 border-2 border-dashed border-border rounded-lg">
                    {t("create.noSuggestions")}
                  </p>
                )}
              </div>

              {orDivider}

              {/* Custom Questions */}
              <div>
                <label className="text-sm font-medium mb-2 block">{t("create.yourQuestions")}</label>
                <div className="flex gap-2">
                  <Input
                    placeholder={t("create.typeQuestion")}
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomQuestion();
                      }
                    }}
                  />
                  <Button type="button" onClick={addCustomQuestion} disabled={!customInput.trim()}>
                    {t("create.add")}
                  </Button>
                </div>
                {customQs.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {customQs.map((q, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 rounded-lg border-2 border-primary/60 bg-primary/5">
                        <span className="text-sm flex-1">{q}</span>
                        <button
                          type="button"
                          onClick={() => removeCustomQuestion(i)}
                          className="p-0.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Count summary */}
              <p className="text-sm text-muted-foreground">
                {t("create.totalSelected")}: <span className="font-medium text-foreground">{getFinalQuestions().length}</span>
              </p>

              {/* Navigation */}
              <div className="flex gap-3 justify-between pt-2">
                <Button type="button" variant="ghost" onClick={() => setStep("form")}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> {t("create.back")}
                </Button>
                <div className="flex gap-3">
                  <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
                    {t("create.cancel")}
                  </Button>
                  {mode === "auto" ? (
                    <Button
                      type="button"
                      onClick={() => setStep("resume")}
                      disabled={getFinalQuestions().length === 0 || loadingSuggestions}
                    >
                      {t("create.next")}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => handleSubmit()}
                      disabled={getFinalQuestions().length === 0 || loading || loadingSuggestions}
                    >
                      {loading ? (
                        <><Loader className="animate-spin mr-2" /> {t("create.generating")}</>
                      ) : (
                        t("create.startInterview")
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {step === "resume" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-display">
                {t("create.resumeTitle")}
              </DialogTitle>
              <DialogDescription>
                {t("create.resumeDesc")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 mt-4">
              {pdfUploadZone}
              {orDivider}
              <Textarea
                placeholder={t("create.pasteResume")}
                rows={6}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t("create.aiProbe")}
              </p>

              <div className="flex gap-3 justify-between pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep("questions")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> {t("create.back")}
                </Button>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleSubmit()}
                    disabled={loading}
                  >
                    {t("create.skip")}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={loading || extracting}
                  >
                    {loading ? (
                      <>
                        <Loader className="animate-spin mr-2" /> {t("create.generating")}
                      </>
                    ) : (
                      t("create.startInterview")
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
