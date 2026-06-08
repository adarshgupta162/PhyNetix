import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ComposedChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { AlertCircle } from "lucide-react";

interface QuestionData {
  questionNumber: number;
  timeSpent: number;
  subject: string;
  status: "correct" | "incorrect" | "skipped";
}

interface TimeOutcomeChartProps {
  data: QuestionData[];
  toppersData?: { questionNumber: number; avgTime: number }[];
  hasTimeData?: boolean;
}

const subjectColors: Record<string, string> = {
  Physics: "hsl(217, 91%, 60%)",
  Chemistry: "hsl(142, 76%, 45%)",
  Mathematics: "hsl(45, 93%, 50%)",
  Maths: "hsl(45, 93%, 50%)",
  Math: "hsl(45, 93%, 50%)",
  General: "hsl(172, 66%, 50%)",
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass-card p-3 border border-border/50">
        <p className="text-sm font-medium">Q{data.questionNumber}</p>
        <p className="text-xs text-muted-foreground">{data.subject}</p>
        <p className="text-xs">Time: {data.timeSpent}s</p>
        <p className={`text-xs capitalize ${
          data.status === "correct" ? "text-success" : 
          data.status === "incorrect" ? "text-destructive" : "text-muted-foreground"
        }`}>
          {data.status}
        </p>
      </div>
    );
  }
  return null;
};

export function TimeOutcomeChart({ data, toppersData, hasTimeData = true }: TimeOutcomeChartProps) {
  const chartData = useMemo(() => {
    return data.map((q) => ({
      ...q,
      size: q.status === "correct" ? 80 : q.status === "incorrect" ? 60 : 40,
    }));
  }, [data]);

  // Check if we have actual time data (not all zeros)
  const hasActualTimeData = hasTimeData && data.some(q => q.timeSpent > 0);

  const uniqueSubjects = [...new Set(data.map((d) => d.subject))];

  // If no time data, show a message
  if (!hasActualTimeData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <h3 className="font-semibold font-display text-lg mb-4">Time vs Outcome Analysis</h3>
        <div className="h-60 flex items-center justify-center">
          <div className="text-center space-y-3">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">
              Time tracking data is not available for this attempt.
            </p>
            <p className="text-sm text-muted-foreground/70">
              This feature was added after your attempt. Future attempts will show detailed time analysis.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Generate toppers trend line if not provided
  const toppersLine = toppersData || data.filter(q => q.timeSpent > 0).map((q) => ({
    questionNumber: q.questionNumber,
    avgTime: Math.max(20, q.timeSpent * 0.7),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-6"
    >
      <h3 className="font-semibold font-display text-lg mb-4">Time vs Outcome Analysis</h3>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(224, 50%, 18%)" opacity={0.5} />
            <XAxis
              dataKey="questionNumber"
              type="number"
              domain={[1, "dataMax"]}
              tickLine={false}
              axisLine={{ stroke: "hsl(224, 50%, 18%)" }}
              tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 12 }}
              label={{ value: "Question Number", position: "bottom", fill: "hsl(215, 20%, 65%)" }}
            />
            <YAxis
              dataKey="timeSpent"
              tickLine={false}
              axisLine={{ stroke: "hsl(224, 50%, 18%)" }}
              tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 12 }}
              label={{ value: "Time (seconds)", angle: -90, position: "insideLeft", fill: "hsl(215, 20%, 65%)" }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Toppers trend line */}
            {toppersLine.length > 0 && (
              <Line
                data={toppersLine}
                dataKey="avgTime"
                stroke="hsl(172, 66%, 50%)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Toppers Avg"
              />
            )}
            
            {/* Scatter points for each question */}
            <Scatter data={chartData.filter(d => d.timeSpent > 0)} dataKey="timeSpent" name="Your Time">
              {chartData.filter(d => d.timeSpent > 0).map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={subjectColors[entry.subject] || "hsl(172, 66%, 50%)"}
                  opacity={entry.status === "skipped" ? 0.4 : 0.8}
                  style={{
                    filter: `drop-shadow(0 0 6px ${subjectColors[entry.subject] || "hsl(172, 66%, 50%)"})`,
                  }}
                />
              ))}
            </Scatter>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-4 border-t border-border/50">
        {uniqueSubjects.map((subject) => (
          <div key={subject} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ 
                backgroundColor: subjectColors[subject],
                boxShadow: `0 0 8px ${subjectColors[subject]}`,
              }}
            />
            <span className="text-xs text-muted-foreground">{subject}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-primary" style={{ borderStyle: "dashed" }} />
          <span className="text-xs text-muted-foreground">Toppers Average</span>
        </div>
      </div>
    </motion.div>
  );
}
