
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { MindMapNode } from '../types';

interface MindMapProps {
  data: MindMapNode;
  isCollapsed: boolean;
  onToggle: () => void;
}

const MindMap: React.FC<MindMapProps> = ({ data, isCollapsed, onToggle }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || isCollapsed || !svgRef.current) return;

    const width = 800;
    const height = 400;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g").attr("transform", "translate(100,0)");

    const tree = d3.tree<MindMapNode>().size([height, width - 200]);
    const root = d3.hierarchy(data);
    tree(root);

    // Links
    g.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", d3.linkHorizontal<any, any>()
        .x(d => d.y)
        .y(d => d.x))
      .attr("fill", "none")
      .attr("stroke", "#475569")
      .attr("stroke-width", 2);

    // Nodes
    const node = g.selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", d => "node" + (d.children ? " node--internal" : " node--leaf"))
      .attr("transform", d => `translate(${d.y},${d.x})`);

    node.append("circle")
      .attr("r", 6)
      .attr("fill", d => d.children ? "#6366f1" : "#1e293b")
      .attr("stroke", "#6366f1")
      .attr("stroke-width", 2);

    node.append("text")
      .attr("dy", ".35em")
      .attr("x", d => d.children ? -12 : 12)
      .attr("text-anchor", d => d.children ? "end" : "start")
      .attr("fill", "#f1f5f9")
      .style("font-size", "12px")
      .text(d => d.data.label);

  }, [data, isCollapsed]);

  return (
    <div className={`transition-all duration-300 ease-in-out border border-slate-800 rounded-xl bg-slate-900/50 overflow-hidden ${isCollapsed ? 'h-12' : 'h-[450px]'}`}>
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 cursor-pointer" onClick={onToggle}>
        <h3 className="font-semibold text-slate-200">Goal Roadmap (Mind Map)</h3>
        <span className="text-xs text-slate-400">{isCollapsed ? 'Show' : 'Hide'} Map</span>
      </div>
      {!isCollapsed && (
        <div className="p-4 flex justify-center items-center h-[400px]">
          <svg ref={svgRef} width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet" className="max-w-full" />
        </div>
      )}
    </div>
  );
};

export default MindMap;
