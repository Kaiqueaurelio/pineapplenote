import { supabase } from "@/integrations/supabase/client";

export const DEMO_TITLE = "Aula exemplo: Neurociência da Aprendizagem e Memória";

const summary =
  "A aula explica como o cérebro transforma informação nova em memória duradoura. " +
  "A atenção seleciona o que entra, o hipocampo consolida durante o sono e a recuperação ativa " +
  "(lembrar sem olhar o material) é o que realmente fixa o conteúdo. Estudar em blocos espaçados " +
  "vence a releitura passiva em praticamente todos os experimentos citados.";

const transcript =
  "Bom dia, pessoal. Hoje vamos falar de como a memória se forma. Primeiro ponto: atenção. " +
  "Sem atenção não há codificação — o estímulo passa, mas não deixa marca. Depois temos a " +
  "consolidação, um processo lento em que o hipocampo reorganiza o traço de memória e envia " +
  "progressivamente para o córtex, principalmente durante o sono profundo. Terceiro ponto: a " +
  "recuperação. Cada vez que você tenta lembrar algo sem consultar, o traço fica mais forte — é o " +
  "efeito de teste. Por isso flashcards e simulados funcionam melhor do que reler o resumo. " +
  "Por fim, o espaçamento: distribuir o estudo em vários dias produz retenção muito maior do que " +
  "concentrar tudo na véspera.";

const topics = [
  {
    title: "Atenção: o portão da memória",
    explanation:
      "Só é codificado aquilo que recebe atenção focada. Ambientes com notificações reduzem a " +
      "profundidade da codificação e geram a sensação enganosa de ter estudado.",
  },
  {
    title: "Consolidação e sono",
    explanation:
      "O hipocampo reativa o conteúdo aprendido durante o sono profundo e o transfere para o " +
      "córtex. Dormir mal depois de estudar desmonta boa parte do ganho da sessão.",
  },
  {
    title: "Efeito de teste (recuperação ativa)",
    explanation:
      "Tentar lembrar sem consultar fortalece o traço de memória mais do que reler. Errar e " +
      "corrigir em seguida produz aprendizado ainda mais estável.",
  },
  {
    title: "Repetição espaçada",
    explanation:
      "Distribuir revisões ao longo de dias aproveita o esquecimento parcial: revisar quando a " +
      "lembrança está quase sumindo gera o maior ganho de retenção.",
  },
];

const flashcards = [
  {
    question: "Por que a atenção é considerada o portão da memória?",
    answer: "Sem atenção focada o estímulo não é codificado, então não há traço de memória a consolidar.",
  },
  {
    question: "Qual o papel do sono na aprendizagem?",
    answer:
      "Durante o sono profundo o hipocampo reativa o conteúdo e o transfere para o córtex, consolidando a memória.",
  },
  {
    question: "O que é o efeito de teste?",
    answer:
      "O fortalecimento da memória provocado por tentar recuperar a informação sem consultar o material.",
  },
  {
    question: "Por que a repetição espaçada supera a maratona de véspera?",
    answer:
      "Revisar quando a lembrança começa a enfraquecer exige mais esforço de recuperação e gera retenção mais duradoura.",
  },
  {
    question: "Reler o resumo várias vezes é eficiente?",
    answer: "Não. Gera familiaridade, não recuperação; flashcards e simulados produzem retenção bem maior.",
  },
];

const quiz = [
  {
    question: "Qual estrutura é central na consolidação de novas memórias?",
    options: ["Cerebelo", "Hipocampo", "Bulbo raquidiano", "Hipotálamo"],
    answer: 1,
    explanation: "O hipocampo organiza o traço recente e o transfere gradualmente para o córtex.",
  },
  {
    question: "Qual estratégia tem melhor evidência de retenção a longo prazo?",
    options: [
      "Reler o capítulo três vezes",
      "Grifar o material inteiro",
      "Responder flashcards espaçados",
      "Ouvir a aula em velocidade dupla",
    ],
    answer: 2,
    explanation: "Recuperação ativa combinada com espaçamento é a dupla com melhor evidência experimental.",
  },
  {
    question: "Estudar 6 horas na véspera comparado a 1 hora por 6 dias tende a:",
    options: [
      "Produzir retenção equivalente",
      "Produzir retenção menor",
      "Produzir retenção maior",
      "Não ter efeito mensurável",
    ],
    answer: 1,
    explanation: "A concentração na véspera favorece desempenho imediato, mas a retenção cai rapidamente.",
  },
];

/** Cria (ou reaproveita) a aula modelo interativa do usuário e devolve o id do material. */
export async function ensureDemoMaterial(userId: string): Promise<string> {
  const { data: existing } = await supabase
    .from("study_materials")
    .select("id")
    .eq("user_id", userId)
    .eq("title", DEMO_TITLE)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: material, error } = await supabase
    .from("study_materials")
    .insert({
      user_id: userId,
      title: DEMO_TITLE,
      source_type: "document",
      mime_type: "text/plain",
      status: "ready",
      storage_path: `demo/${userId}/neurociencia-da-aprendizagem.txt`,
    })
    .select("id")
    .single();

  if (error || !material) throw error ?? new Error("Falha ao criar a aula exemplo.");

  const { error: outputError } = await supabase.from("material_outputs").insert({
    material_id: material.id,
    user_id: userId,
    summary,
    transcript,
    topics,
    flashcards,
    quiz,
  });

  if (outputError) throw outputError;

  return material.id;
}
