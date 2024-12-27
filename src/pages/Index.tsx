import React, { useState } from "react";
import { toast } from "sonner";
import VideoUpload from "@/components/VideoUpload";
import { initializeGemini, analyzeVideo, extractVideoSegment } from "@/services/geminiService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";

interface SearchResult {
  timestamp: string;
  endTimestamp?: string;
  preview: string;
}

const Index = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiKey, setApiKey] = useState("");

  const handleVideoSelect = async (file: File) => {
    setVideoFile(file);
    toast.success("Video uploaded successfully");
  };

  const parseTimestamps = (text: string): { start: string; end?: string }[] => {
    if (text === "not found in the video") {
      return [];
    }

    const timestamps = text.split(',').map(t => t.trim());
    return timestamps.map(timestamp => {
      const range = timestamp.match(/\[(\d{2}:\d{2}:\d{2})\](?:\s*to\s*\[(\d{2}:\d{2}:\d{2})\])?/);
      if (range) {
        return {
          start: range[1],
          end: range[2]
        };
      }
      return { start: timestamp.replace(/[\[\]]/g, '') };
    });
  };

  const handleSearch = async () => {
    if (!apiKey) {
      toast.error("Please enter your Gemini API key");
      return;
    }

    if (!searchQuery) {
      toast.error("Please enter a search query");
      return;
    }

    if (!videoFile) {
      toast.error("Please upload a video first");
      return;
    }

    setIsAnalyzing(true);
    setResults([]);

    try {
      initializeGemini(apiKey);
      const analysisResult = await analyzeVideo(videoFile, searchQuery);
      console.log("Analysis result:", analysisResult);

      const timestampRanges = parseTimestamps(analysisResult);
      
      if (timestampRanges.length > 0) {
        const searchResults = await Promise.all(
          timestampRanges.map(async ({ start, end }) => {
            const preview = await extractVideoSegment(videoFile, start, end);
            return {
              timestamp: start,
              endTimestamp: end,
              preview
            };
          })
        );

        setResults(searchResults);
        toast.success(`Found ${searchResults.length} occurrences of ${searchQuery}`);
      } else {
        toast.info(`No ${searchQuery} found in the video`);
      }
    } catch (error: any) {
      toast.error(error.message || "Error analyzing video");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-display font-bold">Video Object Finder</h1>
          <p className="text-muted-foreground">
            Upload a video and search for specific objects within it
          </p>
        </div>

        <div className="space-y-4">
          <Input
            type="password"
            placeholder="Enter your Gemini API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="max-w-md mx-auto"
          />
          <VideoUpload onVideoSelect={handleVideoSelect} />
        </div>

        <div className="flex gap-4">
          <Input
            placeholder="What object are you looking for?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button
            onClick={handleSearch}
            disabled={isAnalyzing}
            className="min-w-[100px]"
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="ml-2">{isAnalyzing ? "Analyzing" : "Search"}</span>
          </Button>
        </div>

        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <img
                  src={result.preview}
                  alt={`Result ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <p className="text-sm text-gray-600">
                  {result.endTimestamp
                    ? `${result.timestamp} to ${result.endTimestamp}`
                    : result.timestamp}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;