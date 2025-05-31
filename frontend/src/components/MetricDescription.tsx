import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface MetricDescriptionProps {
  description: string;
}

const MetricDescription: React.FC<MetricDescriptionProps> = ({ description }) => {
  const renderFormattedDescription = (text: string) => {
    // Split by double line breaks to separate sections
    const sections = text.split('<br><br>').map((section, index) => {
      if (section.includes('Formula:')) {
        return renderFormulaSection(section, index);
      } else if (section.includes('Definition:')) {
        return renderDefinitionSection(section, index);
      } else if (section.includes('Context:')) {
        return renderContextSection(section, index);
      } else if (section.includes('Interpretation:')) {
        return renderInterpretationSection(section, index);
      } else {
        return renderGenericSection(section, index);
      }
    });

    return sections;
  };

  const renderDefinitionSection = (text: string, key: number) => {
    const content = text.replace('Definition: ', '');
    return (
      <div key={key} className="mb-3">
        <div className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">
          📖 Definition
        </div>
        <div className="text-xs leading-relaxed" style={{ color: 'rgb(var(--color-foreground))' }}>
          {content}
        </div>
      </div>
    );
  };

  const renderFormulaSection = (text: string, key: number) => {
    const content = text.replace('Formula: ', '');
    
    // Split content into lines for processing
    const lines = content.split('<br>').map(line => line.trim()).filter(line => line);
    
    const processedContent = lines.map((line, lineIndex) => {
      // Check if line contains LaTeX syntax or mathematical expressions
      if (isLatexFormula(line)) {
        try {
          // Clean up the LaTeX formula
          const mathFormula = cleanLatexFormula(line);
          return (
            <div 
              key={lineIndex} 
              className="my-2 p-3 bg-green-50 dark:bg-green-900/20 rounded border-l-2 border-green-400 dark:border-green-300"
              style={{
                // Force KaTeX to use theme colors
                color: 'rgb(var(--color-foreground))',
              }}
            >
              <div 
                style={{ 
                  color: 'rgb(var(--color-foreground))',
                  // Override KaTeX default colors
                  filter: 'none',
                }}
                className="katex-override"
              >
                <InlineMath math={mathFormula} />
              </div>
            </div>
          );
        } catch (e) {
          console.warn('KaTeX rendering failed for:', line, e);
          // If KaTeX fails, fall back to formatted text
          return (
            <div key={lineIndex} className="my-1 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-xs" style={{ color: 'rgb(var(--color-foreground))' }}>
              {line}
            </div>
          );
        }
      } else if (line.includes('=') || line.includes('Where ') || line.includes('•')) {
        // This is explanatory text or variable definitions
        return (
          <div key={lineIndex} className="text-xs my-1" style={{ color: 'rgb(var(--color-foreground))' }}>
            {line}
          </div>
        );
      } else {
        return (
          <div key={lineIndex} className="text-xs" style={{ color: 'rgb(var(--color-foreground))' }}>
            {line}
          </div>
        );
      }
    });
  
    return (
      <div key={key} className="mb-3">
        <div className="text-xs font-semibold text-green-800 dark:text-green-300 mb-1">
          🧮 Formula
        </div>
        <div className="space-y-1">
          {processedContent}
        </div>
      </div>
    );
  };

  const renderContextSection = (text: string, key: number) => {
    const content = text.replace('Context: ', '');
    return (
      <div key={key} className="mb-3">
        <div className="text-xs font-semibold text-purple-800 dark:text-purple-300 mb-1">
          🎯 Context
        </div>
        <div className="text-xs leading-relaxed" style={{ color: 'rgb(var(--color-foreground))' }}>
          {content}
        </div>
      </div>
    );
  };

  const renderInterpretationSection = (text: string, key: number) => {
    const content = text.replace('Interpretation:', '');
    const lines = content.split('•').filter(line => line.trim());
    
    return (
      <div key={key} className="mb-3">
        <div className="text-xs font-semibold text-orange-800 dark:text-orange-300 mb-1">
          💡 Interpretation
        </div>
        <div className="space-y-1">
          {lines.map((line, lineIndex) => (
            <div key={lineIndex} className="text-xs flex items-start" style={{ color: 'rgb(var(--color-foreground))' }}>
              <span className="text-orange-700 dark:text-orange-500 mr-1 mt-0.5">•</span>
              <span className="leading-relaxed">{line.trim()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderGenericSection = (text: string, key: number) => {
    return (
      <div key={key} className="mb-2">
        <div className="text-xs leading-relaxed" style={{ color: 'rgb(var(--color-foreground))' }}>
          {text}
        </div>
      </div>
    );
  };

  const isLatexFormula = (text: string): boolean => {
    // Check for LaTeX syntax patterns
    const latexPatterns = [
      /\\text\{/,           // \text{...}
      /\\frac\{/,           // \frac{...}{...}
      /\\left\(/,           // \left(...\right)
      /\\right\)/,          // 
      /\\times/,            // \times
      /\\sum/,              // \sum
      /\\sqrt/,             // \sqrt
      /\\ln/,               // \ln
      /\\log/,              // \log
      /\\exp/,              // \exp
      /\\\\/,               // Any backslash command
      /\^{/,                // Superscript with braces
      /_{/,                 // Subscript with braces
    ];
    
    // Also check for basic math with = signs and mathematical symbols
    const basicMathPatterns = [
      /[a-zA-Z_]+\s*=.*[×∑√²³]/,  // Variable = expression with math symbols
      /.*\\[a-zA-Z]+/,             // Any LaTeX command
    ];
    
    return latexPatterns.some(pattern => pattern.test(text)) || 
           basicMathPatterns.some(pattern => pattern.test(text));
  };

  const cleanLatexFormula = (formula: string): string => {
    // Clean up the LaTeX formula for proper rendering
    let cleaned = formula
      // Remove HTML entities that might interfere
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      
      // Ensure proper spacing around operators
      .replace(/\\times/g, ' \\times ')
      .replace(/\\div/g, ' \\div ')
      
      // Fix any double spaces
      .replace(/\s+/g, ' ')
      .trim();
    
    return cleaned;
  };

  // Legacy function for backward compatibility with simple formulas
  const formatForKaTeX = (formula: string): string => {
    // Convert common mathematical symbols and patterns to KaTeX syntax
    let katexFormula = formula
      // Basic replacements
      .replace(/×/g, ' \\times ')
      .replace(/÷/g, ' \\div ')
      .replace(/±/g, ' \\pm ')
      .replace(/≈/g, ' \\approx ')
      .replace(/≤/g, ' \\leq ')
      .replace(/≥/g, ' \\geq ')
      .replace(/∑/g, ' \\sum ')
      .replace(/√/g, ' \\sqrt ')
      .replace(/²/g, '^2')
      .replace(/³/g, '^3')
      
      // Handle subscripts and superscripts
      .replace(/(\w+)_(\w+)/g, '$1_{$2}')
      .replace(/(\w+)\^(\w+)/g, '$1^{$2}')
      
      // Handle fractions (simple patterns)
      .replace(/(\w+)\s*\/\s*(\w+)/g, '\\frac{$1}{$2}')
      
      // Handle parentheses for grouping
      .replace(/\(/g, '\\left(')
      .replace(/\)/g, '\\right)')
      
      // Handle common function names
      .replace(/ln\(/g, '\\ln(')
      .replace(/log\(/g, '\\log(')
      .replace(/exp\(/g, '\\exp(')
      .replace(/mean\(/g, '\\text{mean}(')
      .replace(/std\(/g, '\\text{std}(')
      .replace(/percentile\(/g, '\\text{percentile}(');

    return katexFormula;
  };

  return (
    <div className="max-w-md text-left">
      {renderFormattedDescription(description)}
    </div>
  );
};

export default MetricDescription;