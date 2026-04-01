"use client"
import { ChartAreaInteractive } from "@/components/AppAreaChart";
import AppBarChart from "@/components/AppBarChart";
import { ChartPieDonutText } from "@/components/AppPieChart";
import CardList from "@/components/CardList";
import TodoList from "@/components/TodoList";
import { motion, easeInOut } from "framer-motion"; // or "motion/react"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: easeInOut } 
  },
};

export default function Home() {
  return (
    <motion.main
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      // Ensure items-stretch is here so cards have equal height
      className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-4 items-stretch"
    >
      {/* Chart Item */}
      <motion.div 
        variants={itemVariants} 
        className="flex flex-col rounded-lg bg-primary-foreground p-4 lg:col-span-2 xl:col-span-1 2xl:col-span-2"
      >
        <div className="flex-1 h-full"> 
          <AppBarChart />
        </div>
      </motion.div>

      {/* List Item */}
      <motion.div 
        variants={itemVariants} 
        className="rounded-lg bg-primary-foreground p-4 overflow-hidden"
      >
        <CardList title="Top Gainers"/>
      </motion.div>
      
      {/* Pie Chart Item */}
      <motion.div 
        variants={itemVariants} 
        className="flex flex-col rounded-lg bg-primary-foreground p-4"
      >
        <div className="flex-1 flex items-center justify-center h-full">
          <ChartPieDonutText />
        </div>
      </motion.div>
          <motion.div 
        variants={itemVariants} 
        className="flex flex-col rounded-lg bg-primary-foreground p-4"
      >
      
          <TodoList />
        
      </motion.div>
      
      {/* Area Chart Item */}
      <motion.div 
        variants={itemVariants} 
        className="flex flex-col rounded-lg bg-primary-foreground p-4 lg:col-span-2 xl:col-span-1 2xl:col-span-2"
      >
        <ChartAreaInteractive />
      </motion.div>
        <motion.div 
        variants={itemVariants} 
        className="flex flex-col rounded-lg bg-primary-foreground p-4"
      >
        <div className="flex-1 flex items-center justify-center h-full">
          <ChartPieDonutText />
        </div>
      </motion.div>
    </motion.main>
  );
}