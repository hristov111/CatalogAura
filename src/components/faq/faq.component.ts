import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FaqComponent {
  @Input() theme: any = null;

  openIndex: number | null = 0;

  faqs = [
    {
      question: "Is my conversation private?",
      answer: "Absolutely. Your privacy is our top priority. All conversations are end-to-end encrypted and we do not sell your personal data to third parties. You can chat with complete peace of mind."
    },
    {
      question: "How does the AI companion learn?",
      answer: "Your companion evolves through your interactions. It remembers your preferences, communication style, and shared memories to build a deeper, more personalized connection over time, just like a real friend."
    },
    {
      question: "Can I switch companions?",
      answer: "Yes, you can connect with multiple companions or switch at any time. However, building a deep bond takes time, so we recommend spending quality time with one to experience the full depth of the connection."
    },
    {
      question: "What is included in the free trial?",
      answer: "The free trial gives you access to basic daily check-ins and text conversations. It's a great way to get a feel for the personality of your companion before committing to a deeper relationship."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, there are no long-term contracts. You can cancel your subscription at any time from your account settings, and you'll continue to have access until the end of your current billing period."
    }
  ];

  toggle(index: number) {
    this.openIndex = this.openIndex === index ? null : index;
  }
}

