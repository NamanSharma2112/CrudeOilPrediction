"use client"
import { ChartAreaInteractive } from "@/components/AppAreaChart";
import AppBarChart from "@/components/AppBarChart";
import { ChartPieDonutText } from "@/components/AppPieChart";
import CardList from "@/components/CardList";
import TodoList from "@/components/TodoList";

export default function Home() {
  return (
    <main
      className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-4 items-stretch"
    >
      {/* Chart Item */}
      <div 
        className="animate-fade-in-down flex flex-col rounded-lg bg-primary-foreground p-4 lg:col-span-2 xl:col-span-1 2xl:col-span-2"
        style={{ animationDelay: "0ms" }}
      >
        <div className="flex-1 h-full"> 
          <AppBarChart />
        </div>
      </div>

      {/* List Item */}
      <div 
        className="animate-fade-in-down rounded-lg bg-primary-foreground p-4 overflow-hidden"
        style={{ animationDelay: "100ms" }}
      >
        <CardList title="Top Gainers"/>
      </div>
      
      {/* Pie Chart Item */}
      <div 
        className="animate-fade-in-down flex flex-col rounded-lg bg-primary-foreground p-4"
        style={{ animationDelay: "200ms" }}
      >
        <div className="flex-1 flex items-center justify-center h-full">
          <ChartPieDonutText />
        </div>
      </div>
      
      {/* Todo List Item */}
      <div 
        className="animate-fade-in-down flex flex-col rounded-lg bg-primary-foreground p-4"
        style={{ animationDelay: "300ms" }}
      >
        <TodoList />
      </div>
      
      {/* Area Chart Item */}
      <div 
        className="animate-fade-in-down flex flex-col rounded-lg bg-primary-foreground p-4 lg:col-span-2 xl:col-span-1 2xl:col-span-2"
        style={{ animationDelay: "400ms" }}
      >
        <ChartAreaInteractive />
      </div>
      
      {/* Second Pie Chart Item */}
      <div 
        className="animate-fade-in-down flex flex-col rounded-lg bg-primary-foreground p-4"
        style={{ animationDelay: "500ms" }}
      >
        <div className="flex-1 flex items-center justify-center h-full">
          <ChartPieDonutText />
        </div>
      </div>
    </main>
  );
}