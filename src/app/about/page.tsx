import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Linkedin, Twitter, Mail, BarChart, Zap, Target } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <header className="text-center mb-12">
        <div className="inline-block mb-4">
            <Image 
              src="/images/1xAI.png" 
              alt="1xAI Logo" 
              width={120} 
              height={120}
              className="rounded-lg"
            />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">1xAI</h1>
        <p className="text-xl text-muted-foreground">AI-Powered Applications</p>
      </header>

      <section className="mb-12 text-center">
        <p className="text-lg max-w-3xl mx-auto">
        1xAI is the creator of Helix, an intelligent LPG logistics and cylinder management platform that enhances inventory optimization, sales and distribution efficiency, expense governance, and workforce productivity through real-time analytics, automation, and unified supply chain visibility.
        </p>
      </section>

      <section className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto bg-accent/20 text-accent p-3 rounded-full w-fit">
                <BarChart className="h-8 w-8" />
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="text-lg font-semibold mb-2">Smart Analytics</h3>
              <p className="text-muted-foreground">
                Insights for better decision making
              </p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardHeader>
                <div className="mx-auto bg-accent/20 text-accent p-3 rounded-full w-fit">
                    <Zap className="h-8 w-8" />
                </div>
            </CardHeader>
            <CardContent>
              <h3 className="text-lg font-semibold mb-2">Streamlined Operations</h3>
              <p className="text-muted-foreground">
                Manage daily operations efficiently
              </p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardHeader>
                <div className="mx-auto bg-accent/20 text-accent p-3 rounded-full w-fit">
                    <Target className="h-8 w-8" />
                </div>
            </CardHeader>
            <CardContent>
              <h3 className="text-lg font-semibold mb-2">Growth Focused</h3>
              <p className="text-muted-foreground">
                Tools designed to scale your business
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="text-center">
        <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
        <div className="flex justify-center items-center space-x-6">
          <Link href="mailto:onexai.inc@gmail.com" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <Mail className="h-5 w-5" />
            <span>onexai.inc@gmail.com</span>
          </Link>
          <Link href="#" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <Linkedin className="h-5 w-5" />
            <span>Connect on LinkedIn</span>
          </Link>
           <Link href="#" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <Twitter className="h-5 w-5" />
            <span>Follow on X</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
