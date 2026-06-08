import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, Flag, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Question {
  id: string;
  question_number: number;
  question_type: string; // 'single', 'multi', 'integer'
  options?: string[];
  marks: number;
  negative_marks: number;
}

interface OMRPanelProps {
  questions: Question[];
  answers: Record<string, string | string[]>;
  markedForReview: Set<string>;
  currentQuestion: number;
  timeLeft: number;
  studentName: string;
  rollNumber: string;
  onAnswerChange: (questionId: string, answer: string | string[]) => void;
  onToggleReview: (questionId: string) => void;
  onQuestionClick: (index: number) => void;
  onSubmit: () => void;
}

export default function OMRPanel({
  questions,
  answers,
  markedForReview,
  currentQuestion,
  timeLeft,
  studentName,
  rollNumber,
  onAnswerChange,
  onToggleReview,
  onQuestionClick,
  onSubmit
}: OMRPanelProps) {
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentQuestion];
  const currentAnswer = currentQ ? answers[currentQ.id] : undefined;

  const handleOptionClick = (option: string) => {
    if (!currentQ) return;

    if (currentQ.question_type === 'single') {
      onAnswerChange(currentQ.id, option);
    } else if (currentQ.question_type === 'multi') {
      const currentAnswers = (currentAnswer as string[]) || [];
      if (currentAnswers.includes(option)) {
        onAnswerChange(currentQ.id, currentAnswers.filter(a => a !== option));
      } else {
        onAnswerChange(currentQ.id, [...currentAnswers, option]);
      }
    }
  };

  const handleIntegerChange = (value: string) => {
    if (!currentQ) return;
    // Allow only numbers and negative sign
    if (/^-?\d*\.?\d*$/.test(value) || value === '') {
      onAnswerChange(currentQ.id, value);
    }
  };

  const isOptionSelected = (option: string) => {
    if (!currentAnswer) return false;
    if (currentQ?.question_type === 'multi') {
      return (currentAnswer as string[]).includes(option);
    }
    return currentAnswer === option;
  };

  const stats = useMemo(() => {
    let answered = 0;
    let marked = 0;
    let unanswered = 0;

    questions.forEach(q => {
      const ans = answers[q.id];
      const isAnswered = ans !== undefined && ans !== '' && 
        (Array.isArray(ans) ? ans.length > 0 : true);
      
      if (isAnswered) answered++;
      else unanswered++;
      
      if (markedForReview.has(q.id)) marked++;
    });

    return { answered, marked, unanswered };
  }, [questions, answers, markedForReview]);

  return (
    <div className="flex flex-col h-full bg-secondary/30 rounded-lg overflow-hidden">
      {/* Header - Timer & Student Info */}
      <div className="p-4 border-b border-border bg-secondary/50">
        {/* Timer */}
        <div className={`text-center mb-4 p-3 rounded-lg ${
          timeLeft < 300 ? 'bg-destructive/20' : 'bg-primary/20'
        }`}>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
            Time Remaining
          </div>
          <div className={`text-3xl font-bold font-mono ${
            timeLeft < 300 ? 'text-destructive' : 'text-primary'
          }`}>
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Student Info */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{studentName || 'Student'}</p>
            <p className="text-sm text-muted-foreground">Roll: {rollNumber}</p>
          </div>
        </div>
      </div>

      {/* Question Palette */}
      <div className="flex-1 overflow-auto p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Question {(currentQuestion + 1).toString().padStart(2, '0')}
        </h3>

        {currentQ && (
          <div className="space-y-4">
            {/* Options for MCQ */}
            {(currentQ.question_type === 'single' || currentQ.question_type === 'multi') && (
              <div className="space-y-2">
                {['A', 'B', 'C', 'D'].map((option) => (
                  <button
                    key={option}
                    onClick={() => handleOptionClick(option)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      isOptionSelected(option)
                        ? 'border-primary bg-primary/20 text-primary'
                        : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isOptionSelected(option)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary'
                    }`}>
                      {option}
                    </span>
                    <span className="flex-1 text-left">Option {option}</span>
                    {isOptionSelected(option) && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </button>
                ))}
                {currentQ.question_type === 'multi' && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Multiple answers allowed
                  </p>
                )}
              </div>
            )}

            {/* Integer/Numerical Input */}
            {(currentQ.question_type === 'integer' || currentQ.question_type === 'numerical') && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Enter your answer:</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={(currentAnswer as string) || ''}
                  onChange={(e) => handleIntegerChange(e.target.value)}
                  placeholder="Enter numerical value"
                  className="text-lg font-mono text-center"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Enter a numerical value (decimals allowed)
                </p>
              </div>
            )}

            {/* Mark for Review */}
            <Button
              variant={markedForReview.has(currentQ.id) ? "default" : "outline"}
              className="w-full"
              onClick={() => onToggleReview(currentQ.id)}
            >
              <Flag className="w-4 h-4 mr-2" />
              {markedForReview.has(currentQ.id) ? 'Marked for Review' : 'Mark for Review'}
            </Button>
          </div>
        )}

        {/* Question Grid */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Question Palette
          </h3>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, index) => {
              const ans = answers[q.id];
              const isAnswered = ans !== undefined && ans !== '' && 
                (Array.isArray(ans) ? ans.length > 0 : true);
              const isMarked = markedForReview.has(q.id);
              const isCurrent = index === currentQuestion;

              return (
                <button
                  key={q.id}
                  onClick={() => onQuestionClick(index)}
                  className={`relative w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background'
                      : isAnswered
                      ? 'bg-[hsl(142,76%,36%)] text-white'
                      : isMarked
                      ? 'bg-[hsl(45,93%,47%)] text-black'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  {index + 1}
                  {isAnswered && !isCurrent && (
                    <Check className="absolute -top-1 -right-1 w-4 h-4 text-[hsl(142,76%,36%)] bg-background rounded-full p-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded-lg bg-[hsl(142,76%,36%)]/20">
            <p className="font-bold text-[hsl(142,76%,36%)]">{stats.answered}</p>
            <p className="text-muted-foreground">Answered</p>
          </div>
          <div className="p-2 rounded-lg bg-[hsl(45,93%,47%)]/20">
            <p className="font-bold text-[hsl(45,93%,47%)]">{stats.marked}</p>
            <p className="text-muted-foreground">Marked</p>
          </div>
          <div className="p-2 rounded-lg bg-secondary">
            <p className="font-bold text-muted-foreground">{stats.unanswered}</p>
            <p className="text-muted-foreground">Unanswered</p>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="p-4 border-t border-border">
        <Button
          variant="gradient"
          className="w-full"
          onClick={onSubmit}
        >
          Submit Test
        </Button>
      </div>
    </div>
  );
}
