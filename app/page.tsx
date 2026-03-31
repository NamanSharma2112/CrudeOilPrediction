"use client"
import AppBarChart from "@/components/AppBarChart";
import { CardImage } from "@/components/AppCard";
import { ChartPieDonutText } from "@/components/AppPieChart";
import CardList from "@/components/CardList";
import { motion } from "motion/react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Delay between each child animation
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 }, // Slide up slightly
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Home() {
  return (
    <motion.main
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-4"
    >
      {/* Chart Item */}
      <motion.div 
        variants={itemVariants} 
        className="rounded-lg bg-primary-foreground p-4 lg:col-span-2 xl:col-span-1 2xl:col-span-2"
      >
        <AppBarChart />
      </motion.div>

      {/* Test Items */}
      <motion.div variants={itemVariants} className="rounded-lg bg-primary-foreground p-4">
      <CardList title="Top Gainers"/>
      </motion.div>
      
      <motion.div variants={itemVariants} className="rounded-lg bg-primary-foreground p-4">
        <ChartPieDonutText />
      </motion.div>
      
      {/* Shortened for brevity, but apply motion.div + variants to all 3 below */}
      {[1, 2, 3].map((_, index) => (
        <motion.div 
          key={index} 
          variants={itemVariants} 
          className="rounded-lg bg-primary-foreground p-4"
        >
          Test
        </motion.div>
      ))}
    </motion.main>
  );
}