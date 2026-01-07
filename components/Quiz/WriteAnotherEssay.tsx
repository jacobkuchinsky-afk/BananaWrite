'use client'

import { useRouter } from 'next/navigation'
import { ArrowRightIcon, PenIcon } from '@/components/Icons/Icons'
import styles from './Quiz.module.css'

interface WriteAnotherEssayProps {
  message?: string
}

export default function WriteAnotherEssay({ 
  message = "You've completed all the quizzes! Now write another essay to apply what you've learned."
}: WriteAnotherEssayProps) {
  const router = useRouter()

  const handleWriteEssay = () => {
    router.push('/write')
  }

  return (
    <div className={styles.writeAnotherSection}>
      <h2 className={styles.writeAnotherTitle}>
        Time for Another Essay! <PenIcon size={24} />
      </h2>
      
      <p className={styles.writeAnotherSubtitle}>
        {message}
      </p>
      
      <button onClick={handleWriteEssay} className={styles.continueBtn}>
        Start Writing <ArrowRightIcon size={18} />
      </button>
    </div>
  )
}


