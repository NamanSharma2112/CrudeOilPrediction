import React from 'react'
import { Card, CardContent, CardFooter, CardTitle } from './ui/card'
import Image from 'next/image'
import { Badge } from './ui/badge'


const populateData = () => [
    { 
        id: 1, 
        title: 'Crude Oil WTI', 
        badge: 'Energy', 
        image: 'https://loremflickr.com/800/600/oil,rig', 
        count: 45 
    },
    { 
        id: 2, 
        title: 'Brent Crude', 
        badge: 'Energy', 
        image: 'https://loremflickr.com/800/600/petroleum,refinery', 
        count: 38 
    },
    { 
        id: 3, 
        title: 'OPEC Basket', 
        badge: 'Index', 
        image: 'https://loremflickr.com/800/600/oil,barrel', 
        count: 52 
    },
    { 
        id: 4, 
        title: 'Natural Gas', 
        badge: 'Energy', 
        image: 'https://loremflickr.com/800/600/natural,gas', 
        count: 29 
    },
    { 
        id: 5, 
        title: 'Heating Oil', 
        badge: 'Derivative', 
        image: 'https://loremflickr.com/800/600/fire,heating', 
        count: 34 
    },
    { 
        id: 6, 
        title: 'Gasoline', 
        badge: 'Fuel', 
        image: 'https://loremflickr.com/800/600/gas,station', 
        count: 41 
    },
]

const CardList = ({title}:{title:string}) => {
    const list = title === "Top Gainers" ? populateData() : populateData().reverse()
  return (
    <div>
      <h2 className='text-lg font-medium mb-6'>{title}</h2>
   <div className='flex flex-col gap-2'>
    {list.map(item => (
        <Card key={item.id} className='flex-row items-center  justify-between gap-3 p-4 '>
            <div className='w-12 h-12 rounded-sm relative overflow-hidden'>
                <Image src={item.image} alt={item.title} fill className='object-cover'/>
            </div>
       <CardContent className='p-0'>
        <CardTitle className='text-sm font-medium'>{item.title}</CardTitle>
        <Badge variant="secondary" >{item.badge}</Badge>
       </CardContent>
        <CardFooter>{item.count}</CardFooter>
        </Card>
    ))}
   </div>
    </div>
  )
}

export default CardList
